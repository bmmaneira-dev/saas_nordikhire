"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createJob } from "../actions";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function NewJobForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(createJob, undefined);
  const t = dict.newJob;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <Link
        href="/dashboard/jobs"
        className="text-sm text-muted-foreground underline"
      >
        {t.back}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {t.title}
      </h1>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <Field label={t.fieldTitle}>
            <Input type="text" name="title" required />
          </Field>

          <Field label={t.fieldDescription}>
            <Textarea name="description" rows={4} />
          </Field>

          <Field label={t.fieldRequirements}>
            <Textarea name="requirementsText" rows={4} />
          </Field>

          <Field label={t.fieldSkills}>
            <Input
              type="text"
              name="skills"
              placeholder={t.skillsPlaceholder}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t.fieldSeniority}>
              <Select name="seniorityLevel">
                <option value="">—</option>
                <option value="junior">{t.seniorityJunior}</option>
                <option value="pleno">{t.seniorityMid}</option>
                <option value="senior">{t.senioritySenior}</option>
                <option value="lead">{t.seniorityLead}</option>
              </Select>
            </Field>
            <Field label={t.fieldWorkMode}>
              <Select name="workMode">
                <option value="">—</option>
                <option value="presencial">{t.workModeOnsite}</option>
                <option value="remoto">{t.workModeRemote}</option>
                <option value="híbrido">{t.workModeHybrid}</option>
              </Select>
            </Field>
          </div>

          <Field label={t.fieldLocation}>
            <Input type="text" name="location" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t.fieldSalaryMin}>
              <Input type="number" name="salaryMin" />
            </Field>
            <Field label={t.fieldSalaryMax}>
              <Input type="number" name="salaryMax" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="publish"
              defaultChecked
              className="h-4 w-4 accent-primary"
            />
            {t.publishNow}
          </label>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 self-start">
            {pending ? t.creating : t.create}
          </Button>
        </form>
    </div>
  );
}
