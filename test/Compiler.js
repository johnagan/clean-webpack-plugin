'use strict';

function Compiler(){
    this.steps = {}; 
}

Compiler.prototype.plugin = function (step, func){ this.steps[step] = func; };
Compiler.prototype.runStep = function (step) { return this.steps[step] && this.steps[step](); };

module.exports = Compiler;
