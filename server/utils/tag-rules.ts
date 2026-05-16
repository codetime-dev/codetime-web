// Port of codetime-server-v3/src/services/tags.py rule evaluator. The
// tag rule schema is a recursive tree of either:
//   - condition: { type: 'condition', field, condition_type, value }
//   - group:     { operator: 'AND'|'OR', conditions: Rule[] }
// Field names support camelCase aliases (workspaceName -> workspace_name).
// All comparisons are case-insensitive except REGEX (which uses /.../i).

export type WorkspaceData = {
  workspace_name?: string | null
  language?: string | null
  git_origin?: string | null
  git_branch?: string | null
  platform?: string | null
  editor?: string | null
  absolute_file?: string | null
  relative_file?: string | null
}

const FIELD_ALIAS: Record<string, keyof WorkspaceData> = {
  workspaceName: 'workspace_name',
  gitOrigin: 'git_origin',
  gitBranch: 'git_branch',
  absoluteFile: 'absolute_file',
  relativeFile: 'relative_file',
  workspace_name: 'workspace_name',
  git_origin: 'git_origin',
  git_branch: 'git_branch',
  absolute_file: 'absolute_file',
  relative_file: 'relative_file',
  language: 'language',
  platform: 'platform',
  editor: 'editor',
}

function evalCondition(cond: Record<string, any>, ws: WorkspaceData): boolean {
  const field = FIELD_ALIAS[String(cond.field)] ?? (cond.field as keyof WorkspaceData)
  const raw = ws[field]
  const fieldValue = raw == null ? '' : String(raw)
  const condValue = String(cond.value ?? '')
  // Rules written by the Python service store `condition_type` (pydantic
  // dumps the field name in snake_case). The Nuxt PUT handler historically
  // passed wire camelCase through unchanged, so older rows may carry
  // `conditionType`. Accept both so payloads from either era match.
  const type = String(cond.condition_type ?? cond.conditionType ?? '')
  const isRegex = type === 'REGEX' || type === 'NOT_REGEX'
  const a = isRegex ? fieldValue : fieldValue.toLowerCase()
  const b = isRegex ? condValue : condValue.toLowerCase()

  switch (type) {
    case 'CONTAINS': { return a.includes(b)
    }
    case 'EQUALS': { return a === b
    }
    case 'STARTS_WITH': { return a.startsWith(b)
    }
    case 'ENDS_WITH': { return a.endsWith(b)
    }
    case 'REGEX': {
      try {
 return new RegExp(b, 'i').test(a)
}
      catch {
 return false
}
    }
    case 'NOT_CONTAINS': { return !a.includes(b)
    }
    case 'NOT_EQUALS': { return a !== b
    }
    case 'NOT_STARTS_WITH': { return !a.startsWith(b)
    }
    case 'NOT_ENDS_WITH': { return !a.endsWith(b)
    }
    case 'NOT_REGEX': {
      try {
 return !new RegExp(b, 'i').test(a)
}
      catch {
 return true
}
    }
    default: { return false
    }
  }
}

export function evaluateRule(rule: any, ws: WorkspaceData): boolean {
  if (!rule || typeof rule !== 'object') {
 return false
}
  if (rule.type === 'condition') {
 return evalCondition(rule, ws)
}
  if ('operator' in rule && Array.isArray(rule.conditions)) {
    if (rule.operator === 'AND') {
 return rule.conditions.every((c: any) => evaluateRule(c, ws))
}
    if (rule.operator === 'OR') {
 return rule.conditions.some((c: any) => evaluateRule(c, ws))
}
  }
  if ('field' in rule && ('condition_type' in rule || 'conditionType' in rule) && 'value' in rule) {
    return evalCondition(rule, ws)
  }
  return false
}
