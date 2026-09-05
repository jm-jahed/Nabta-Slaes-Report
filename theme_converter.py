import re

with open('src/components/dashboard/NabtaReport.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('bg-slate-950', 'bg-slate-50'),
    ('text-slate-100', 'text-slate-900'),
    ('text-white', 'text-slate-900'),
    ('bg-slate-900/90', 'bg-white/90'),
    ('bg-slate-900/95', 'bg-white/95'),
    ('bg-slate-900/50', 'bg-slate-100/50'),
    ('bg-slate-900', 'bg-white'),
    ('border-slate-800', 'border-slate-200'),
    ('border-slate-850', 'border-slate-200'),
    ('bg-slate-850', 'bg-slate-50'),
    ('bg-slate-800', 'bg-slate-100'),
    ('text-slate-400', 'text-slate-500'),
    ('text-slate-300', 'text-slate-600'),
    ('text-slate-200', 'text-slate-700'),
    ('text-emerald-400', 'text-emerald-600'),
    ('text-rose-400', 'text-rose-600'),
    ('text-amber-400', 'text-amber-600'),
    ('bg-slate-950/60', 'bg-slate-100/60'),
    ('bg-slate-950/80', 'bg-slate-100/80'),
    ('bg-slate-950/50', 'bg-slate-100/50'),
    ('from-slate-950', 'from-slate-50'),
    ('via-slate-900', 'via-white'),
    ('to-slate-950', 'to-slate-50'),
    ('hover:bg-slate-800/30', 'hover:bg-slate-100'),
    ('hover:bg-slate-700', 'hover:bg-slate-200'),
    ('divide-slate-800/60', 'divide-slate-200'),
    ('divide-slate-800', 'divide-slate-200'),
    ('bg-slate-850/80', 'bg-slate-50/80'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('src/components/dashboard/NabtaReport.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Converted!")
