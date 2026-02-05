/**
 * File Watcher Module
 *
 * Watches vault for external changes and emits events.
 */

export {
  FileWatcher,
  fileWatcher,
  startWatching,
  stopWatching,
  onFileChange,
  isWatching,
  getWatchedPath,
  type FileChangeCallback,
} from './file-watcher';
