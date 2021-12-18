const global_module = require('module');

const real_load = global_module._load.bind(global_module);
const builtin_list = global_module.builtinModules;

// Monkey-patch Node's `require` function to prevent monkey-patching.
function monkey(opts) {
	global_module._load = make_fake_load(opts);
}

// Remove the monkey-patch.
function unmonkey() {
	global_module._load = real_load;
}

// Generate a fake _load method using the supplied options.
function make_fake_load(opts) {
	// Convert non-object opts into an object.
	opts = (typeof opts !== 'object') ? { all: opts } : (opts || {});

	// Replace non-function opts.log with an empty function.
	const log = (typeof opts.log === 'function') ? opts.log : ()=>{};

	// Return the fake _load method based on the options.
	return function (request, parent, isMain) {
		// Shorthand for calling the real load function with the same args.
		// We can't just load it here, because uncache needs to un-cache it
		// before loading it, in case it was already been loaded before 
		// the monkeying started.
		const load_it = () => real_load(request, parent, isMain);
		
		// Let relative paths pass through unchanged.
		// to-do:
		// In the future, maybe try to limit this to relative paths
		// within the same parent module.
		if (request.startsWith('./') || request.startsWith('../')) {
			return load_it();

		} else {
			// Determine from the options which action needs to be done
			// on this module's exports.
			let is_builtin = builtin_list.includes(request);
			let action =
				// Check for the by-name setting first...
				hasOwn(opts, 'byname', request) ? opts.byname[request] :
				
				// Then, if the requested module is a built-in,
				// check the setting for built-in modules...
				(is_builtin && hasOwn(opts, 'builtin')) ? opts.builtin :
				
				// Finally, fall back on the default `all` setting,
				// or no action at all if it wasn't set.
				hasOwn(opts, 'all') ? opts.all : null;

			switch (action) {
				case 'uncache': 
					// Delete the cached module before loading it,
					// in case it's been loaded elsewhere before monkey-dont.
					if (!is_builtin) {
						log(`uncache ${request}`);
						let resolved = require.resolve(request, {
							paths: parent.paths
						});
						delete require.cache[resolved];
					}
					return load_it();

				// The other two get loaded first and then frozen or cloned.
				case 'freeze':
					log(`freeze ${request}`);
					return freeze_deep(load_it());
				
				case 'clone':
					log(`clone ${request}`);
					return clone_deep(load_it());
				
				default:
					return load_it();
			}
		}
	};
}

// Shorthand for recursive hasOwnProperty checks.
const hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(o, ...p) {
	return (
		o && (typeof o === 'object') && 
		hasOwnProperty.call(o, p[0]) && 
		(p.length === 1 || hasOwn(o[p[0]], p.slice(1)))
	);
}

// Get a deep clone of the supplied value.
function clone_deep(val, all_real, all_clones) {
	// Prevent infinite loops.
	all_real = all_real || [];
	all_clones = all_clones || [];
	
	if (!val || typeof val !== 'object' || all_clones.includes(val)) {
		return val;
	}

	let index = all_real.indexOf(val);
	if (index >= 0) {
		return all_clones[index];
	}

	let isarr = val instanceof Array;
	
	let real = val;
	let clone = isarr ? [] : {};
	all_real.push(real);
	all_clones.push(clone);
	
	if (isarr) {
		real.forEach(item => {
			clone.push(clone_deep(item, all_real, all_clones));
		});
	}
	
	Object.getOwnPropertyNames(real).forEach(p => {
		clone[p] = clone_deep(real[p], all_real, all_clones);
	});
	
	return clone;
}

// Freeze the supplied value if it's an object.
function freeze_deep(val) {
	if (val && (typeof val === 'object' || typeof val === 'function')) {
		// Prevent infinite loops.
		if (!Object.isFrozen(val)) {
			Object.freeze(val);
			if (val instanceof Array) {
				val.forEach(item => {
					freeze_deep(item);
				});
			}
			Object.getOwnPropertyNames(val).forEach(p => {
				freeze_deep(val[p]);
			});
		}
	}
	return val;
}

module.exports = {
	monkey,
	unmonkey,
};
