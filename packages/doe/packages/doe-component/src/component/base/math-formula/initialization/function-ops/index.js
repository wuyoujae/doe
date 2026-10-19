// Origin: public/yrkie-doe/components/math-formula/math-formula.js:48
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.FUNCTION_OPS = new Set([
    "log", "ln", "exp", "sin", "cos", "tan", "cot", "sec", "csc",
    "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "deg", "ker",
    "dim", "det", "arg", "Pr", "gcd",
  ]);
}
