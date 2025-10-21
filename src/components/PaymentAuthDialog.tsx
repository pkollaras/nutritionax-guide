import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentAuthDialogProps {
  open: boolean;
}

export const PaymentAuthDialog = ({ open }: PaymentAuthDialogProps) => {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("signup.authorization.waiting")}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-4">
            <p>{t("signup.authorization.message")}</p>
            <p className="text-sm font-medium text-primary">
              {t("signup.authorization.doNotClose")}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};
