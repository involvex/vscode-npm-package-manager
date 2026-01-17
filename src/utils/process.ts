import { spawn } from "child_process";

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const shell = isWindows ? true : false;

    const proc = spawn(command, args, {
      cwd,
      shell,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", data => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", data => {
      stderr += data.toString();
    });

    proc.on("close", code => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      });
    });

    proc.on("error", error => {
      reject(error);
    });
  });
}
