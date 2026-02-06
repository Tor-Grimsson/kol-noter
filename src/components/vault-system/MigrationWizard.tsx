/**
 * Migration Wizard
 *
 * Step-by-step wizard for migrating from localStorage to file system vault.
 */

import { useState, useCallback } from 'react';
import {
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Folder,
  FolderTree,
  Image,
  ArrowRight,
  Trash2,
  HardDrive,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pickVaultFolder, getDefaultVaultPath, isTauri } from '@/lib/tauri-bridge';
import {
  exportToVault,
  validateLocalStorageData,
  hasLocalStorageData,
  getLocalStorageSize,
  formatBytes,
  type MigrationProgress,
  type MigrationResult,
} from '@/lib/migration';

export interface MigrationWizardProps {
  /** Whether the wizard is open */
  open: boolean;
  /** Called when wizard is closed */
  onOpenChange: (open: boolean) => void;
  /** Called when migration is complete */
  onComplete?: (result: MigrationResult) => void;
}

type WizardStep = 'intro' | 'validate' | 'select-folder' | 'options' | 'migrating' | 'complete' | 'error';

export function MigrationWizard({
  open,
  onOpenChange,
  onComplete,
}: MigrationWizardProps) {
  const [step, setStep] = useState<WizardStep>('intro');
  const [validation, setValidation] = useState<ReturnType<typeof validateLocalStorageData> | null>(null);
  const [vaultPath, setVaultPath] = useState<string>('');
  const [clearLocalStorage, setClearLocalStorage] = useState(false);
  const [skipAttachments, setSkipAttachments] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const localStorageSize = getLocalStorageSize();
  const hasData = hasLocalStorageData();

  // Reset wizard when opened
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setStep('intro');
      setValidation(null);
      setVaultPath('');
      setClearLocalStorage(false);
      setSkipAttachments(false);
      setProgress(null);
      setResult(null);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  // Step: Validate data
  const handleValidate = useCallback(() => {
    const validationResult = validateLocalStorageData();
    setValidation(validationResult);
    setStep('validate');
  }, []);

  // Step: Select folder
  const handleSelectFolder = useCallback(async () => {
    const defaultPath = await getDefaultVaultPath();
    const selected = await pickVaultFolder({
      title: 'Select or Create Vault Folder',
      defaultPath,
    });

    if (selected) {
      setVaultPath(selected);
      setStep('options');
    }
  }, []);

  // Step: Start migration
  const handleStartMigration = useCallback(async () => {
    setStep('migrating');
    setProgress({ phase: 'preparing', current: 0, total: 0 });

    const migrationResult = await exportToVault(vaultPath, {
      clearLocalStorage,
      skipAttachments,
      onProgress: setProgress,
    });

    setResult(migrationResult);
    setStep(migrationResult.success ? 'complete' : 'error');
    onComplete?.(migrationResult);
  }, [vaultPath, clearLocalStorage, skipAttachments, onComplete]);

  // Calculate progress percentage
  const progressPercent = progress
    ? progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {/* Step: Intro */}
        {step === 'intro' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Migrate to File System
              </DialogTitle>
              <DialogDescription>
                Move your notes from browser storage to local markdown files.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!isTauri() ? (
                <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Desktop App Required</p>
                    <p className="text-sm text-muted-foreground">
                      Migration requires the desktop app. You're currently running in the browser.
                    </p>
                  </div>
                </div>
              ) : !hasData ? (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">No Data to Migrate</p>
                    <p className="text-sm text-muted-foreground">
                      Your localStorage is empty. Nothing to migrate.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Current storage</span>
                      <span className="ml-auto font-mono text-sm">
                        {formatBytes(localStorageSize)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Target</span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        Markdown files
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">What happens:</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        Systems become folders
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        Projects become subfolders
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        Notes become .md files
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        Images saved to assets/
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleValidate}
                disabled={!isTauri() || !hasData}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Validate */}
        {step === 'validate' && validation && (
          <>
            <DialogHeader>
              <DialogTitle>Data Validation</DialogTitle>
              <DialogDescription>
                Checking your data before migration...
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Folder className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Systems</span>
                  <span className="ml-auto font-mono">{validation.systems}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FolderTree className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Projects</span>
                  <span className="ml-auto font-mono">{validation.projects}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Notes</span>
                  <span className="ml-auto font-mono">{validation.notes}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Image className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Attachments</span>
                  <span className="ml-auto font-mono">{validation.attachments}</span>
                </div>
              </div>

              {validation.valid ? (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">
                    All data is valid and ready to migrate
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-600 dark:text-yellow-400">
                      Found {validation.errors.length} issue(s)
                    </span>
                  </div>
                  <ScrollArea className="h-24 border rounded-md p-2">
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('intro')}>
                Back
              </Button>
              <Button onClick={handleSelectFolder}>
                Select Vault Folder
                <FolderOpen className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Options */}
        {step === 'options' && (
          <>
            <DialogHeader>
              <DialogTitle>Migration Options</DialogTitle>
              <DialogDescription>
                Configure how the migration should work.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Vault Location</p>
                <p className="text-sm text-muted-foreground truncate">{vaultPath}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="clearLocalStorage"
                    checked={clearLocalStorage}
                    onCheckedChange={(checked) => setClearLocalStorage(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="clearLocalStorage" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Clear localStorage after migration
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Removes browser data after successful migration
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="skipAttachments"
                    checked={skipAttachments}
                    onCheckedChange={(checked) => setSkipAttachments(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="skipAttachments" className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Skip attachments (faster)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Images will stay as base64 in note data
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('validate')}>
                Back
              </Button>
              <Button onClick={handleStartMigration}>
                Start Migration
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Migrating */}
        {step === 'migrating' && progress && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Migrating...
              </DialogTitle>
              <DialogDescription>
                Please wait while your data is being exported.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Progress value={progressPercent} />

              <div className="text-center">
                <p className="text-sm font-medium capitalize">{progress.phase}</p>
                {progress.currentItem && (
                  <p className="text-sm text-muted-foreground truncate">
                    {progress.currentItem}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step: Complete */}
        {step === 'complete' && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Migration Complete
              </DialogTitle>
              <DialogDescription>
                Your data has been exported successfully.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Folder className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Systems</span>
                  <span className="ml-auto font-mono">{result.systemsExported}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FolderTree className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Projects</span>
                  <span className="ml-auto font-mono">{result.projectsExported}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Notes</span>
                  <span className="ml-auto font-mono">{result.notesExported}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Image className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Attachments</span>
                  <span className="ml-auto font-mono">{result.attachmentsExported}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Completed in {(result.duration / 1000).toFixed(1)}s
              </p>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Vault Location</p>
                <p className="text-sm text-muted-foreground truncate">{vaultPath}</p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Error */}
        {step === 'error' && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Migration Failed
              </DialogTitle>
              <DialogDescription>
                Some errors occurred during migration.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <ScrollArea className="h-32 border rounded-md p-3">
                <ul className="text-sm text-destructive space-y-1">
                  {result.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </ScrollArea>

              <p className="text-sm text-muted-foreground">
                {result.notesExported} notes were exported before the error occurred.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('options')}>
                Try Again
              </Button>
              <Button onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
