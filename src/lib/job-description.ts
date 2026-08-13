export interface JobDescriptionSections {
  role: string;
  location: string;
  jobType: string;
  payout: string;
  roleOverview: string;
  keyResponsibilities: string[];
  requiredSkillsQualifications: string[];
  moreAboutOpportunity: string;
  equalOpportunityEmployer: string;
}

export interface GeneratedJobContent {
  description: string;
  requiredSkills: string[];
  sections: JobDescriptionSections;
}

function bulletList(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

export function formatJobDescription(sections: JobDescriptionSections): string {
  return `Role: ${sections.role}
Location: ${sections.location}
Job Type: ${sections.jobType}
Payout: ${sections.payout}


Role Overview:
${sections.roleOverview}

Key Responsibilities:
${bulletList(sections.keyResponsibilities)}

Required Skills & Qualifications:
${bulletList(sections.requiredSkillsQualifications)}

More About the Opportunity:
${sections.moreAboutOpportunity}

Equal Opportunity Employer:
${sections.equalOpportunityEmployer}

Apply Now!`;
}

export function buildJobGenerationPrompt(
  title: string,
  experienceLevel: string,
  companyName?: string,
  keywords?: string
): string {
  const company = companyName ? `"${companyName}"` : 'the hiring company';
  const notesContext =
    keywords && keywords.trim().length > 0
      ? `\n\nRECRUITER INPUT KEYWORDS / SHORT SUMMARY:\n"""\n${keywords.trim()}\n"""\nIMPORTANT: Use the above keywords, requirements, notes, and preferences provided by the recruiter to craft the description accurately.`
      : '';

  return `You are an expert technical recruiter writing for ${company}.
Generate a professional, high-quality job posting for the role "${title}" at ${experienceLevel} experience level.${notesContext}

CRITICAL FORMATTING & LOCATION RULES:
1. DO NOT assume or hardcode regional location defaults such as India (e.g. Bangalore, Mumbai, INR ₹) UNLESS specifically requested in the user's keywords.
2. If location is not provided in keywords, default to a clean neutral format like "Remote", "Hybrid", or "Onsite".
3. If salary/payout currency is not provided, use standard USD ($) or a generic "Competitive salary commensurate with experience" statement.
4. Keep the tone professional, engaging, and suitable for modern companies worldwide.

Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "role": "${title}",
  "location": "Remote / Hybrid / Onsite (or location specified in recruiter keywords)",
  "jobType": "Full-time / Part-time / Contract",
  "payout": "Competitive salary range in USD ($) or appropriate for location",
  "roleOverview": "2-3 compelling paragraphs about the role and team",
  "keyResponsibilities": ["responsibility 1", "responsibility 2", "responsibility 3", "responsibility 4", "responsibility 5"],
  "requiredSkillsQualifications": ["skill or qualification 1", "skill or qualification 2", "skill or qualification 3", "skill or qualification 4", "skill or qualification 5"],
  "moreAboutOpportunity": "1-2 paragraphs about growth, culture, and benefits",
  "equalOpportunityEmployer": "A standard equal opportunity employer statement",
  "requiredSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"]
}

The requiredSkills array should contain the top technical/professional skills extracted from the posting.`;
}

export function parseGeneratedJobContent(raw: unknown): GeneratedJobContent | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Record<string, unknown>;
  const stringField = (key: string) =>
    typeof data[key] === 'string' && (data[key] as string).trim().length > 0
      ? (data[key] as string).trim()
      : null;

  const listField = (key: string) => {
    if (!Array.isArray(data[key])) return null;
    const items = (data[key] as unknown[])
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
    return items.length > 0 ? items : null;
  };

  const role = stringField('role');
  const location = stringField('location');
  const jobType = stringField('jobType');
  const payout = stringField('payout');
  const roleOverview = stringField('roleOverview');
  const keyResponsibilities = listField('keyResponsibilities');
  const requiredSkillsQualifications = listField('requiredSkillsQualifications');
  const moreAboutOpportunity = stringField('moreAboutOpportunity');
  const equalOpportunityEmployer = stringField('equalOpportunityEmployer');
  const requiredSkills = listField('requiredSkills');

  if (
    !role ||
    !location ||
    !jobType ||
    !payout ||
    !roleOverview ||
    !keyResponsibilities ||
    !requiredSkillsQualifications ||
    !moreAboutOpportunity ||
    !equalOpportunityEmployer ||
    !requiredSkills
  ) {
    return null;
  }

  const sections: JobDescriptionSections = {
    role,
    location,
    jobType,
    payout,
    roleOverview,
    keyResponsibilities,
    requiredSkillsQualifications,
    moreAboutOpportunity,
    equalOpportunityEmployer,
  };

  return {
    sections,
    description: formatJobDescription(sections),
    requiredSkills,
  };
}
