import test from "node:test";
import assert from "node:assert/strict";
import { classifyPhoneLayout } from "../src/phone-layout.js";

test("phone landscape and portrait use the same session across handset sizes", () => {
  for (const [width, height] of [[667,375],[812,375],[844,390],[874,402],[896,414],[932,430],[956,440]]) {
    assert.equal(classifyPhoneLayout({ width, height, coarsePointer: true }), "landscape");
    assert.equal(classifyPhoneLayout({ width: height, height: width, coarsePointer: true }), "portrait");
  }
});
test("narrow desktop windows, tablets and the Tesla viewport never trigger the phone gate", () => {
  for (const [width, height, coarsePointer] of [[390,844,false],[773,601,true],[601,773,true],[1024,768,true],[768,1024,true],[1280,800,false]]) {
    assert.equal(classifyPhoneLayout({ width, height, coarsePointer }), null);
  }
});
