// Builds the C kernel (c_engine/) with the system compiler and runs it.
// The kernel prints JSON, we just pass it on to the browser.
import fs from 'fs';
import path from 'path';
import { execFile, spawn } from 'child_process';

const RES_DIR = path.resolve('c_engine');
const RES_BIN = path.join(RES_DIR, process.platform === 'win32' ? 'resqsync_kernel.exe' : 'resqsync_kernel');
const RES_SOURCES = ['main.c', 'pcb.c', 'cpu_scheduler.c', 'synchronization.c', 'ipc_pipe.c', 'bankers_algorithm.c', 'deadlock.c'];

export const resKernelState = { resReady: false, resCompiler: null, resError: null };

function resNeedsBuild() {
  if (!fs.existsSync(RES_BIN)) return true;
  const resBinTime = fs.statSync(RES_BIN).mtimeMs;
  return fs
    .readdirSync(RES_DIR)
    .filter((resF) => resF.endsWith('.c') || resF.endsWith('.h'))
    .some((resF) => fs.statSync(path.join(RES_DIR, resF)).mtimeMs > resBinTime);
}

function resTryCompile(resCompiler) {
  return new Promise((resResolve) => {
    try {
      execFile(
        resCompiler,
        ['-std=gnu11', '-O2', '-pthread', '-o', RES_BIN, ...RES_SOURCES.map((resF) => path.join(RES_DIR, resF))],
        { timeout: 60000 },
        (resErr, resOut, resStderr) => resResolve(resErr ? { ok: false, msg: resStderr || resErr.message } : { ok: true })
      );
    } catch (resErr) {
      // Some Windows setups cannot launch an installed compiler at all.
      // Keep the API and web app usable; only the native OS lab needs it.
      resResolve({ ok: false, msg: resErr.message });
    }
  });
}

export async function resBuildKernel() {
  if (!resNeedsBuild()) {
    resKernelState.resReady = true;
    resKernelState.resCompiler = 'already built';
    return;
  }
  for (const resCompiler of ['cc', 'gcc', 'clang']) {
    const resResult = await resTryCompile(resCompiler);
    if (resResult.ok) {
      resKernelState.resReady = true;
      resKernelState.resCompiler = resCompiler;
      console.log(`[kernel] C kernel compiled with ${resCompiler}`);
      return;
    }
    resKernelState.resError = resResult.msg;
  }
  console.log('[kernel] Could not compile the C kernel. Native OS lab actions will be unavailable.');
  console.log('[kernel] Install a working C compiler and restart to enable them.');
  console.log(`[kernel] ${String(resKernelState.resError).split('\n')[0]}`);
}

/** runs one kernel command; resInput is written to its stdin */
export function resRunKernel(resArgs, resInput = '') {
  return new Promise((resResolve, resReject) => {
    if (!resKernelState.resReady) {
      return resReject(Object.assign(new Error('The C kernel is unavailable. Install a working C compiler, then restart the server.'), { status: 503 }));
    }
    const resChild = spawn(RES_BIN, resArgs.map(String));
    let resOut = '';
    let resErrText = '';
    const resTimer = setTimeout(() => resChild.kill('SIGKILL'), 15000);
    resChild.stdout.on('data', (resD) => (resOut += resD));
    resChild.stderr.on('data', (resD) => (resErrText += resD));
    resChild.on('error', (resE) => {
      clearTimeout(resTimer);
      resReject(resE);
    });
    resChild.on('close', () => {
      clearTimeout(resTimer);
      try {
        resResolve(JSON.parse(resOut.trim().split('\n').pop()));
      } catch {
        resReject(new Error(`Kernel gave no JSON: ${resErrText || resOut}`.slice(0, 300)));
      }
    });
    resChild.stdin.end(resInput);
  });
}
