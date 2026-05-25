"use client";

import { Button, Input, SectionCard, Textarea } from "@astro/ui";
import { useT } from "@astro/i18n";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqEditorProps {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
  getItemError?: (index: number) => string | undefined;
}

export function FaqEditor({ items, onChange, getItemError }: FaqEditorProps) {
  const t = useT();

  function updateItem(index: number, patch: Partial<FaqItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...items, { question: "", answer: "" }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <SectionCard
          key={index}
          title={t("dashboard.faqEditor.itemTitle", { index: index + 1 })}
        >
          <div className="space-y-3">
            <Input
              label={t("dashboard.faqEditor.question")}
              value={item.question}
              onChange={(e) => updateItem(index, { question: e.target.value })}
            />
            <Textarea
              label={t("dashboard.faqEditor.answer")}
              value={item.answer}
              error={getItemError?.(index)}
              onChange={(e) => updateItem(index, { answer: e.target.value })}
            />
            <Button variant="ghost" type="button" onClick={() => removeItem(index)}>
              {t("dashboard.faqEditor.remove")}
            </Button>
          </div>
        </SectionCard>
      ))}
      <Button type="button" onClick={addItem}>
        {t("dashboard.faqEditor.addItem")}
      </Button>
    </div>
  );
}
