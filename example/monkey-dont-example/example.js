require('monkey-dont').monkey({
	log: console.log.bind(console),

	all: 'clone',
	builtin: false,
	byname: {
		'bar': 'clone',
		'zote': 'uncache',
	},
});

let fs0 = require('fs');
let real_mkdir = fs0.mkdir;
let fake_mkdir = ()=>{};
fs0.mkdir = fake_mkdir;

let zote0 = require('zote');
let real_zote0_name = zote0.name;
let fake_zote0_name = () => 'zote fake';
zote0.name = fake_zote0_name;

let foo1 = require('foo');
let real_foo1_name = foo1.name;
let fake_foo1_name = () => 'foo fake';
foo1.name = fake_foo1_name;
let foo2 = require('foo');

let fs1 = foo1.fs;
let zote1 = foo1.zote;

let bar1 = require('bar');
let real_bar1_name = bar1.name;
let fake_bar1_name = () => 'bar fake';
bar1.name = fake_bar1_name;
let bar2 = require('bar');


let foo1count1 = foo1.count();
foo1.inc();
let foo1count2 = foo1.count();

let foo2count1 = foo2.count();
foo2.inc();
let foo2count2 = foo2.count();


let bar1count1 = bar1.count();
bar1.inc();
let bar1count2 = bar1.count();

let bar2count1 = bar2.count();
bar2.inc();
let bar2count2 = bar2.count();


let zote0count1 = zote0.count();
zote0.inc();
let zote0count2 = zote0.count();

let zote1count1 = zote1.count();
zote1.inc();
let zote1count2 = zote1.count();


// Some manual testing functions
function r() {
	console.log('');
}
function h(msg) {
	console.log(`=== ${msg} ===`);
}
function e(exp, msg) {
	console.log(`${exp} // ${eval(exp)} // ${msg || ''}`);
}

/*
Some manual tests:
h(heading) -> === heading ===
e(expression, expected) -> expression // actual // expected
*/

r();
h("Requiring a built-in module, fs:");
h("Built-ins can't be uncached, so the same mutable object is returned.");
h("With freeze, the same object is returned but is now immutable.");
h("With clone, a mutable copy is returned.");
e('fs0 === fs1', 'clone: false, freeze: true, uncache: true');
r();
h("Replacing the mkdir method on fs:");
h("With clone, fs0 accepts fake method but fs1 still has the original.");
h("With freeze, fs0 doesn't accept the fake method so both have the original.");
h("With uncache, the original is returned (because built-in), so changes to fs0 are also seen in fs1.");
e('fs0.mkdir === fs1.mkdir', 'clone: false, freeze: true, uncache: true');
e('fs0.mkdir === fake_mkdir', 'clone: true, freeze: false, uncache: true');
e('fs1.mkdir === fake_mkdir', 'clone: false, freeze: false, uncache: true');
e('fs0.mkdir === real_mkdir', 'clone: false, freeze: true, uncache: false');
e('fs1.mkdir === real_mkdir', 'clone: true, freeze: true, uncache: false');
r();
h("Requiring an installed module, zote, from the main file and from inside another module, foo:");
r();
h("Clone and uncache both result in separate zotes.");
h("Freeze results in a single zote that can't be changed.");
e('zote0 === zote1', 'clone: false, freeze: true, uncache: false');
e('zote0.name()', 'clone: zote fake, freeze: zote real, uncache: zote fake');
e('zote1.name()', 'clone: zote real, freeze: zote real, uncache: zote real');
e('zote0.name === zote1.name', 'clone: false, freeze: true, uncache: false');
r();
h("With clone, zote0 gets the fake method, and zote1 keeps the same real one that was replaced on zote0.");
h("With freeze, both zotes have the same real method.");
h("With uncache, zote0 gets the fake method, but zote1 gets a *different* real method than zote0 started with.");
e('zote0.name === fake_zote0_name', 'clone: true, freeze: false, uncache: true');
e('zote1.name === fake_zote0_name', 'clone: false, freeze: false, uncache: false');
e('zote0.name === real_zote0_name', 'clone: false, freeze: true, uncache: false');
e('zote1.name === real_zote0_name', 'clone: true, freeze: true, uncache: false');
r();
h("With clone and freeze, both zotes operate on the same internal `count` variable.");
h("With uncache, the two zotes operate on separate `count` variables.");
e('zote0count1', 'clone: 0, freeze: 0, uncache: 0');
e('zote0count2', 'clone: 1, freeze: 1, uncache: 1');
e('zote1count1', 'clone: 1, freeze: 1, uncache: 0');
e('zote1count2', 'clone: 2, freeze: 2, uncache: 1');
r();
