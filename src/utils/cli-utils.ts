/** 命令行工具函数 */

/** 解析命令行参数 */
export function parseArgv(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = argv[i + 1];

      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg;
        i++; // 跳过下一个参数
      } else {
        args[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      args[key] = true;
    }
  }

  return args;
}
