"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { SETTINGS_FIELDS } from "@/lib/settings";
import { saveSettings } from "@/server/actions/admin-settings-actions";

const GROUP_TITLES: Record<string, { title: string; description: string }> = {
  brand: { title: "Brand", description: "How the shop names itself." },
  contact: {
    title: "Contact",
    description:
      "Used by every contact link, the WhatsApp button and the organisation structured data. Nothing here is hard-coded in a component.",
  },
  social: { title: "Social", description: "Left blank, the link is simply not shown." },
  commerce: {
    title: "Commerce",
    description:
      "Money values are entered in major units and stored in minor units. Delivery and tax are applied at checkout by the same code that shows them in the cart.",
  },
  content: { title: "Copy", description: "Recurring lines shown across the storefront." },
};

const GROUP_ORDER = ["brand", "contact", "social", "commerce", "content"] as const;

/**
 * Settings editor.
 *
 * All values are held as strings and coerced server-side by the same code that
 * reads them, so the form never has to know how a setting is stored.
 */
export function SettingsForm({
  values: initial,
  currencySymbol,
}: {
  values: Record<string, string>;
  currencySymbol: string;
}) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const dirty = Object.keys(values).some((key) => values[key] !== initial[key]);

  function submit() {
    startTransition(async () => {
      const result = await saveSettings({ values });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
      <div className="space-y-6">
        {GROUP_ORDER.map((group) => {
          const fields = SETTINGS_FIELDS.filter((field) => field.group === group);
          if (fields.length === 0) return null;

          return (
            <Panel
              key={group}
              title={GROUP_TITLES[group].title}
              description={GROUP_TITLES[group].description}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => {
                  const key = field.key as string;
                  const value = values[key] ?? "";

                  if (field.type === "boolean") {
                    return (
                      <div key={key} className="sm:col-span-2">
                        <Checkbox
                          checked={value === "true"}
                          onCheckedChange={(checked) =>
                            setValues((current) => ({
                              ...current,
                              [key]: checked === true ? "true" : "false",
                            }))
                          }
                          label={field.label}
                        />
                        {field.help ? (
                          <p className="mt-2 text-xs leading-relaxed text-faint">{field.help}</p>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <Field
                      key={key}
                      label={
                        field.type === "money" ? `${field.label} (${currencySymbol})` : field.label
                      }
                      hint={field.help}
                      className={field.type === "textarea" ? "sm:col-span-2" : undefined}
                    >
                      {({ id }) =>
                        field.type === "textarea" ? (
                          <Textarea
                            id={id}
                            rows={3}
                            value={value}
                            onChange={(event) =>
                              setValues((current) => ({ ...current, [key]: event.target.value }))
                            }
                          />
                        ) : (
                          <Input
                            id={id}
                            type={field.type === "number" || field.type === "money" ? "number" : "text"}
                            value={value}
                            onChange={(event) =>
                              setValues((current) => ({ ...current, [key]: event.target.value }))
                            }
                          />
                        )
                      }
                    </Field>
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="sticky bottom-6 h-fit border border-line bg-canvas p-5 shadow-sm lg:top-6">
        <Button onClick={submit} disabled={pending || !dirty} className="w-full">
          {pending ? <Spinner className="size-4" /> : null}
          Save settings
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          Changes take effect across the storefront immediately.
        </p>
      </div>
    </div>
  );
}
