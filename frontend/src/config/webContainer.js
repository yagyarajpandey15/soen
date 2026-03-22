import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;
// Module-level process ref — persists across component mounts/unmounts
let activeProcess = null;

export const getWebContainer = async () => {
    if (webContainerInstance === null) {
        webContainerInstance = await WebContainer.boot();
    }
    return webContainerInstance;
};

// Kill whatever is currently running before starting something new
export const killActiveProcess = () => {
    if (activeProcess) {
        try { activeProcess.kill(); } catch { /* already dead */ }
        activeProcess = null;
    }
};

export const setActiveProcess = (proc) => {
    activeProcess = proc;
};
