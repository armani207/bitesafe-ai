import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile, useUpdateProfile, dbProfileToHealthProfile } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const diabetesOptions = [
  { value: 'none', label: 'None' },
  { value: 'type1', label: 'Type 1' },
  { value: 'type2', label: 'Type 2' },
  { value: 'prediabetes', label: 'Prediabetes' },
  { value: 'gestational', label: 'Gestational' },
] as const;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseList(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { data: dbProfile } = useProfile();
  const updateProfile = useUpdateProfile();

  const healthProfile = useMemo(() => dbProfileToHealthProfile(dbProfile ?? null), [dbProfile]);

  const [name, setName] = useState(dbProfile?.name ?? '');
  const [diabetesType, setDiabetesType] = useState(healthProfile?.diabetesType ?? 'none');
  const [usesInsulin, setUsesInsulin] = useState(healthProfile?.usesInsulin ?? false);
  const [age, setAge] = useState(String(healthProfile?.age ?? 30));
  const [weight, setWeight] = useState(String(healthProfile?.weight ?? 70));
  const [height, setHeight] = useState(String(healthProfile?.height ?? 170));
  const [bodyFat, setBodyFat] = useState(
    healthProfile?.bodyFatPercentage ? String(healthProfile.bodyFatPercentage) : ''
  );
  const [medications, setMedications] = useState((healthProfile?.medications ?? []).join(', '));
  const [conditions, setConditions] = useState(
    (healthProfile?.conditions ?? []).map((c) => c.name).join(', ')
  );
  const [goals, setGoals] = useState((healthProfile?.goals ?? []).map((g) => g.name).join(', '));
  const [allergies, setAllergies] = useState((healthProfile?.allergies ?? []).join(', '));
  const [dietary, setDietary] = useState((healthProfile?.dietaryRestrictions ?? []).join(', '));

  const isSaving = updateProfile.isPending;

  const handleSave = async () => {
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    const parsedAge = Number(age);
    const parsedWeight = Number(weight);
    const parsedHeight = Number(height);
    const parsedBodyFat = bodyFat.trim() ? Number(bodyFat) : null;

    if (!Number.isFinite(parsedAge) || parsedAge < 13 || parsedAge > 120) {
      toast.error('Age must be between 13 and 120');
      return;
    }
    if (!Number.isFinite(parsedWeight) || parsedWeight < 25 || parsedWeight > 400) {
      toast.error('Weight must be between 25kg and 400kg');
      return;
    }
    if (!Number.isFinite(parsedHeight) || parsedHeight < 100 || parsedHeight > 250) {
      toast.error('Height must be between 100cm and 250cm');
      return;
    }
    if (parsedBodyFat !== null && (!Number.isFinite(parsedBodyFat) || parsedBodyFat < 2 || parsedBodyFat > 70)) {
      toast.error('Body fat must be between 2% and 70%');
      return;
    }

    const conditionNames = parseList(conditions);
    const goalNames = parseList(goals);

    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        diabetes_type: diabetesType,
        uses_insulin: usesInsulin,
        age: parsedAge,
        weight: parsedWeight,
        height: parsedHeight,
        body_fat_percentage: parsedBodyFat,
        conditions: conditionNames.map((item) => ({
          id: slugify(item),
          name: item,
          icon: '🩺',
          description: '',
        })),
        goals: goalNames.map((item) => ({
          id: slugify(item),
          name: item,
          icon: '🎯',
        })),
        medications: parseList(medications),
        allergies: parseList(allergies),
        dietary_restrictions: parseList(dietary),
        is_onboarded: true,
      });

      toast.success('Health profile updated');
      navigate('/profile');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(msg);
    }
  };

  return (
    <AppLayout headerProps={{ title: 'Edit Health Profile', subtitle: 'Update your personal settings' }}>
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6 pb-28">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <div className="space-y-4">
          <div>
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
          </div>

          <div>
            <Label htmlFor="profile-diabetes">Diabetes Type</Label>
            <select
              id="profile-diabetes"
              value={diabetesType}
              onChange={(e) => setDiabetesType(e.target.value as typeof diabetesType)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {diabetesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="profile-insulin">Uses insulin</Label>
            <input
              id="profile-insulin"
              type="checkbox"
              checked={usesInsulin}
              onChange={(e) => setUsesInsulin(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="profile-age">Age</Label>
              <Input id="profile-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="profile-bodyfat">Body Fat %</Label>
              <Input id="profile-bodyfat" type="number" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="profile-weight">Weight (kg)</Label>
              <Input id="profile-weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="profile-height">Height (cm)</Label>
              <Input id="profile-height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="mt-2" />
            </div>
          </div>

          <div>
            <Label htmlFor="profile-conditions">Health Conditions (comma-separated)</Label>
            <Input id="profile-conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="profile-goals">Goals (comma-separated)</Label>
            <Input id="profile-goals" value={goals} onChange={(e) => setGoals(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="profile-medications">Medications (comma-separated)</Label>
            <Input id="profile-medications" value={medications} onChange={(e) => setMedications(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="profile-allergies">Allergies (comma-separated)</Label>
            <Input id="profile-allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="profile-dietary">Dietary Restrictions (comma-separated)</Label>
            <Input id="profile-dietary" value={dietary} onChange={(e) => setDietary(e.target.value)} className="mt-2" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
        <div className="mx-auto flex w-full max-w-md gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/profile')}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
