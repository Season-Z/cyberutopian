#!/usr/bin/env node
import { program } from "commander";
// import { iconInit } from "./importSvg/iconInit";
import { getPackageJson, Log } from "./importSvg/utils";
import { addSingleSvg } from "./importSvg/addSingleSvg";
import { addBatchSvg } from "./importSvg/addBatchSvg";
import { delOrigin, setOrigin, showOrigin } from "./importSvg/resourceOrigin";
import { iconInit, IconInitType } from "./icon-init";

program
  .version(`version: ${getPackageJson().version}`, "-V, --version", "版本名称")
  .option("-i, --init [framework] [path]", "初始化，path为初始化文件存放目录 (default: './src/icon')")
  .option("-a, --add [iconName] [icons...]", "添加指定名称的icon，多个icon请以空格分开；使用 . 则全部添加")
  .option("-s, --set-origin [key=value] [key=value...]", "设置icon资源地址")
  .option("-d,--del-origin [key] [key...]", "删除icon资源地址")
  .option("-show, --show-origin", "查看icon资源地址")
  .parse();

const options = program.opts();

if (options) {
  // 初始化
  if (options.init) {
    // const path = typeof options.init === "boolean" ? "./src/icon" : options.init;
    iconInit(options as IconInitType);
  }

  // 设置icon资源地址
  if (options.setOrigin) {
    if (Array.isArray(options.setOrigin)) {
      setOrigin(options.setOrigin);
    } else {
      Log.warn("设置icon源格式 `key=value` 不可为空");
    }
  }

  // 删除icon资源地址
  if (options.delOrigin) {
    if (Array.isArray(options.delOrigin)) {
      delOrigin(options.delOrigin);
    } else {
      Log.warn("删除icon源格式 `key` 不可为空");
    }
  }

  // 查看资源地址
  if (options.showOrigin) showOrigin();

  // 添加指定icon
  if (options.add) {
    if (typeof options.add === "boolean") {
      Log.warn('请指定添加的icon的名称或者使用"."进行全量导入');
    } else if (Array.isArray(options.add) && options.add.length === 1 && options.add[0] === ".") {
      addBatchSvg();
    } else {
      addSingleSvg(options.add);
    }
  }
}
