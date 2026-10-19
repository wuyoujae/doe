// Origin: public/yrkie-doe/core/semantic-text-layout.js:23
import { scope as __doeScope } from "../../layout/runtime/context/index.js";

export function initialize() {
__doeScope.ATOMIC_VALUE = /^(?:https?:\/\/[^\s，。；！？]+|www\.[^\s，。；！？]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|第(?:\d+|[一二三四五六七八九十百]+)(?:季度|阶段|部分|章|节|期|页|年)|[A-Za-z][A-Za-z0-9]*(?:[-'’][A-Za-z0-9]+)*|[+-]?(?:\d[\d,]*(?:\.\d+)?)(?:\s?(?:%|％|个百分点|亿元|万元|亿美元|元|亿|万|千|百|季度|个月|年|月|天|小时|分钟|秒|[A-Za-z]+\d*))?)/u;
}
