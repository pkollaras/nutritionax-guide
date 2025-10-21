import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParsedBodyMeasurement {
  measurement_date: string;
  triceps_1: number | null;
  triceps_2: number | null;
  waist_1: number | null;
  waist_2: number | null;
  back_1: number | null;
  back_2: number | null;
  armpit_1: number | null;
  armpit_2: number | null;
  chest_1: number | null;
  chest_2: number | null;
  abdomen_1: number | null;
  abdomen_2: number | null;
  thigh_1: number | null;
  thigh_2: number | null;
  body_fat_percentage: number | null;
  body_mass_percentage: number | null;
  fat_mass: number | null;
  lean_body_mass: number | null;
  notes: string | null;
}

interface PDFUploadSectionProps {
  onParsed: (data: ParsedBodyMeasurement) => void;
  clientId: string;
  disabled?: boolean;
}

export const PDFUploadSection = ({ onParsed, clientId, disabled }: PDFUploadSectionProps) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      toast.error(t('bodyMeasurements.invalidFileType'));
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(t('bodyMeasurements.fileTooLarge'));
      return;
    }

    setFile(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(file);
      const pdfBase64 = await base64Promise;

      // Call edge function
      const { data, error } = await supabase.functions.invoke('parse-body-measurements-pdf', {
        body: { pdfBase64, clientId }
      });

      if (error) {
        console.error('Edge function error:', error);
        if (error.message.includes('Rate limit')) {
          toast.error(t('bodyMeasurements.rateLimitError'));
        } else {
          toast.error(t('bodyMeasurements.parseError'));
        }
        return;
      }

      if (data?.measurement) {
        toast.success(t('bodyMeasurements.parseSuccess'));
        onParsed(data.measurement);
        setFile(null); // Clear file after successful parse
      } else {
        toast.error(t('bodyMeasurements.parseError'));
      }
    } catch (err) {
      console.error('Parse error:', err);
      toast.error(t('bodyMeasurements.parseError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-2">
        <Label htmlFor="pdf-upload" className="text-base font-semibold">
          {t('bodyMeasurements.uploadPdf')}
        </Label>
        <p className="text-sm text-muted-foreground">
          {t('bodyMeasurements.uploadOptional')}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={disabled || loading}
          className="flex-1"
        />
        <Button
          onClick={handleAnalyze}
          disabled={!file || disabled || loading}
          className="sm:w-auto w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('bodyMeasurements.analyzing')}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {t('bodyMeasurements.analyzePdf')}
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('bodyMeasurements.orManualEntry')}
      </p>
    </div>
  );
};
