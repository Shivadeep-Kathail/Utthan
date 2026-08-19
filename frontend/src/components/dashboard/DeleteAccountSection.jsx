import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import * as authApi from '@/api/auth.api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Delete account section with confirmation dialog.
 * Calls DELETE /users/deleteMe, then logs the user out.
 */
function DeleteAccountSection() {
  const { logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await authApi.deleteMe();
      toast.success('Account deleted');
      setOpen(false);
      // Logout clears state and redirects to home
      await logout();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-card danger-zone">
      <div className="settings-card-header">
        <div className="flex items-center gap-2">
          <Trash2 className="size-4 text-destructive" aria-hidden="true" />
          <h3 className="settings-card-title">Delete account</h3>
        </div>
        <p className="settings-card-desc">
          Permanently delete your account and all associated data.
          This action cannot be undone.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={<Button variant="destructive" size="sm" />}
        >
          Delete my account
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account. All your campaigns,
              donations, and activity data will be lost. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              loading={isDeleting}
            >
              Yes, delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { DeleteAccountSection };
