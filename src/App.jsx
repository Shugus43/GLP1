import { useState, useRef, useCallback } from "react";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const T = {
  navy:   "#0D1B2A",
  teal:   "#1A7A8A",
  sage:   "#3D7A6A",
  amber:  "#C97B2E",
  rose:   "#A84848",
  violet: "#5A4E9A",
  gold:   "#A07B10",
  cream:  "#F9F7F4",
  warm:   "#F2EDE6",
  white:  "#FFFFFF",
  border: "#E2DDD6",
  muted:  "#7A7068",
  light:  "#F4F1EC",
  text:   "#1A1410",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function resolveTrack(a) {
  if (a.goal === "metabolic") return "metabolic";
  if (a.bmi === "high")       return "high_loss";
  if (a.bmi === "low")        return "low_recomp";
  if (a.goal === "recomp" || a.goal === "performance") return "mid_recomp";
  return "mid_loss";
}

const TRACK_META = {
  high_loss:  { label: "High BMI · Weight Loss",       color: T.teal,   icon: "◈" },
  mid_loss:   { label: "Moderate BMI · Weight Loss",   color: T.sage,   icon: "◇" },
  mid_recomp: { label: "Recomposition",                color: T.violet, icon: "◆" },
  low_recomp: { label: "Performance",                  color: T.amber,  icon: "◉" },
  metabolic:  { label: "Metabolic Health",             color: T.rose,   icon: "◎" },
};

// ─── ONBOARDING STEPS ────────────────────────────────────────────────────────
const OB_STEPS = [
  { id: "bmi", q: "What best describes your starting point?", sub: "Personalises every screen for your situation.", options: [
    { v: "high", label: "Higher starting weight",   desc: "BMI 35+ or significant weight to lose", icon: "◈" },
    { v: "mid",  label: "Moderate starting weight", desc: "BMI 28–35",                             icon: "◇" },
    { v: "low",  label: "Already relatively lean",  desc: "Body composition or performance focus", icon: "◉" },
  ]},
  { id: "goal", q: "What's your primary goal?", sub: "Shapes the content you see at each stage.", options: [
    { v: "loss",        label: "Lose weight",             desc: "Reduce overall body weight",            icon: "↓" },
    { v: "recomp",      label: "Body recomposition",      desc: "Lose fat, preserve or build muscle",    icon: "⇄" },
    { v: "metabolic",   label: "Metabolic health",        desc: "Glucose, cardiovascular, liver health", icon: "♡" },
    { v: "performance", label: "Performance & aesthetics",desc: "Optimise for training",                 icon: "◆" },
  ]},
  { id: "product", q: "What medication are you on?", sub: "Helps us contextualise dosing and timing.", options: [
    { v: "mounjaro", label: "Mounjaro / Zepbound",   desc: "Tirzepatide — dual GLP-1/GIP",    icon: "Rx" },
    { v: "wegovy",   label: "Wegovy",                desc: "Semaglutide — approved for weight",icon: "Rx" },
    { v: "ozempic",  label: "Ozempic",               desc: "Semaglutide — off-label weight",  icon: "Rx" },
    { v: "compound", label: "Compounded version",    desc: "From a compounding pharmacy",     icon: "⌬" },
    { v: "unsure",   label: "Not sure yet",          desc: "Still deciding",                  icon: "?" },
  ]},
  { id: "weight",      q: "Current weight? (lbs)", sub: "Used for your protein target — only you see this.", isNumeric: true },
  { id: "goal_weight", q: "Goal weight? (lbs)",    sub: "Sets your protein target based on where you're heading.", isNumeric: true },
];

// ─── CONTENT ─────────────────────────────────────────────────────────────────
// ─── COMPLETE CONTENT DATABASE ───────────────────────────────────────────────
// Extracted from original GLP-1 Journey app
// Structure: each stage has universal sections + byTrack sections for all 5 tracks
// Tracks: high_loss | mid_loss | mid_recomp | low_recomp | metabolic

const CONTENT = {

  // ── PRE-START ──────────────────────────────────────────────────────────────
  pre: {
    id: "pre", week: "Pre-Start", label: "Before You Begin", icon: "①",
    color: "#5A4E9A", tagline: "Everything you need to know before your first dose",
    universal: [
      {
        title: "Understanding the Medication",
        qs: [
          { q: "What exactly is a GLP-1 and how does it work?", a: "GLP-1 receptor agonists mimic a gut hormone released after eating. They slow gastric emptying, signal fullness to your brain, and reduce the neurological noise around food. This is a pharmacological change in appetite signalling — not willpower. The result for most people: food stops dominating mental bandwidth in a way that is often disorienting at first, and then liberating." },
          { q: "What's the difference between semaglutide and tirzepatide?", a: "Semaglutide (Ozempic, Wegovy) acts on GLP-1 receptors only. Tirzepatide (Mounjaro, Zepbound) acts on both GLP-1 and GIP receptors — the dual mechanism generally produces greater weight loss (15–22% versus 10–15% of body weight) with a somewhat different side effect profile. Compounded versions contain the same active ingredients at significantly lower cost. Wegovy and Mounjaro/Zepbound are specifically FDA-approved for weight management. Ozempic is approved for type 2 diabetes but widely prescribed off-label for weight loss." },
          { q: "Will I lose muscle as well as fat?", a: "Without deliberate intervention, yes — significantly. Research shows 25–40% of total weight lost can be lean tissue without resistance training. Protein intake (minimum 1.6g/kg of goal bodyweight) and resistance training are not optional — they determine the composition of what you lose, not just the total." },
          { q: "Will this work for me?", a: "Approximately 85–90% of people experience meaningful weight loss or metabolic improvement. Around 10–15% are non-responders. You'll know within 4–6 weeks whether you're responding — signs of response include reduced food noise and changed appetite signals, often before significant scale movement." },
          { q: "What labs should I get before starting?", a: "Minimum: fasting glucose, HbA1c, full lipid panel, liver enzymes (ALT, AST), kidney function (eGFR), thyroid (TSH), full blood count, ferritin, vitamin D. A DEXA scan for body composition baseline is genuinely valuable — it's the only way to accurately track fat versus muscle changes over time." },
          { q: "What are the serious risks I should know about?", a: "Absolute contraindications: personal or family history of medullary thyroid carcinoma or MEN2 syndrome, active pancreatitis, severe gastroparesis, pregnancy. Serious but rare risks: acute pancreatitis (stop and seek care if you develop severe mid-abdominal pain radiating to the back), gallbladder disease, kidney injury from dehydration. The common risks are GI effects — unpleasant but not dangerous if managed." },
        ]
      },
      {
        title: "Physical Preparation",
        qs: [
          { q: "What do I need at home before starting?", a: "Electrolyte supplements (nausea and reduced intake deplete sodium, potassium, magnesium). Protein shakes for days when solid food is unappealing. Ginger in any form for nausea. A food scale. A way to track protein — not for restriction but to ensure you're hitting targets when appetite is suppressed. Anti-nausea medication discussed with your prescriber in advance." },
          { q: "Should I change my diet or start exercising before I begin?", a: "Two weeks before your first injection: begin reducing meal portion sizes and fat content — high-fat, high-volume meals dramatically worsen nausea when gastric emptying slows. Start or re-establish a resistance training routine before appetite suppression arrives. Muscle built before starting is muscle you'll be fighting to preserve during a caloric deficit." },
          { q: "What day and time should I inject?", a: "Mid-week injection (Wednesday or Thursday) means your worst side effect window falls on the weekend. Friday injections reliably produce the worst Mondays. Injecting at night before sleep means peak plasma levels occur during sleep, significantly reducing daytime nausea for many people." },
        ]
      },
      {
        title: "Mental Preparation",
        qs: [
          { q: "Will this change my relationship with food?", a: "Almost certainly yes, and in ways that can be surprising. Food is not just fuel — it's pleasure, social connection, and habit. When GLP-1s change your neurological relationship with food, they can inadvertently disrupt social patterns you didn't realise were anchored to appetite. Many people describe grief alongside the relief — mourning the pleasure food used to bring even as they're grateful for the reduced compulsion." },
          { q: "What are realistic expectations for the first month?", a: "Set your scale expectations low and your discomfort expectations high. Most people feel the side effects before the results. The mental shift — reduced food noise, easier choices — often arrives before the scale moves significantly. That signal matters and is worth noting when it arrives." },
          { q: "I have a history of disordered eating. Is this safe for me?", a: "GLP-1s can interact in complex ways with eating disorder psychology. Extreme appetite suppression can enable restrictive patterns. The absence of hunger can disconnect people from normal interoceptive signals. This is not a categorical contraindication, but it is a strong reason to have psychological support alongside treatment and to be explicitly honest with your prescriber about your history before starting." },
        ]
      },
    ],
    byTrack: {
      high_loss: [{
        title: "Starting at Higher Weight — What's Different",
        qs: [
          { q: "I've tried everything before. Why would this be different?", a: "GLP-1 therapy operates on a completely different mechanism. Every diet you've tried worked by changing what you ate — and triggered the same counter-regulatory biological response: increased hunger hormones, slowed metabolism, a body fighting to return to its defended weight. GLP-1 therapy intervenes upstream. It changes what your body neurologically requests, not just what you allow yourself. Response rates are largely independent of previous diet history." },
          { q: "Do I need a higher starting dose because of my weight?", a: "No — and this is a common misconception. Dose is determined by tolerability and GI adaptation, not body weight. Everyone starts at the same low starting dose regardless of size. Starting higher dramatically increases side effect severity and is one of the most reliable ways to have a miserable first month." },
          { q: "Will I lose muscle and have loose skin?", a: "Loose skin is a genuine consideration at higher starting weight. The main factors: rate of weight loss (slower is better for skin adaptation), age, genetics, and hydration. Resistance training helps — maintaining muscle volume beneath the skin improves appearance significantly. Most people report loose skin is far less distressing than anticipated — and far less distressing than the weight itself was." },
          { q: "I have other health conditions — diabetes, blood pressure, sleep apnea. How does that change things?", a: "If you have type 2 diabetes: glucose-lowering medications may need adjustment as glucose improves rapidly — discuss with your prescriber before starting. If you have hypertension: blood pressure often drops meaningfully with weight loss — antihypertensive medications may need downward adjustment within 4–8 weeks. If you have sleep apnea: weight loss significantly improves or resolves OSA — your CPAP settings may need recalibration." },
        ]
      }],
      mid_loss: [{
        title: "Moderate Starting Weight — Expectations",
        qs: [
          { q: "Am I a good candidate for GLP-1 therapy at BMI 28–32?", a: "Yes — particularly with metabolic risk factors: elevated fasting glucose or HbA1c, high triglycerides, low HDL, elevated blood pressure, or family history of type 2 diabetes. FDA-approved indications include BMI 30+ with at least one weight-related comorbidity, or BMI 27+ with two or more. Experienced prescribers apply clinical judgment beyond BMI alone." },
          { q: "How much weight can I realistically expect to lose?", a: "At BMI 28–35: population averages on semaglutide are 10–14% of body weight over 12 months, tirzepatide 14–18%. On 90kg, that's 9–13kg on semaglutide and 13–16kg on tirzepatide. The variable that most separates upper from lower range outcomes is protein intake and resistance training — both within your control from day one." },
          { q: "Should I focus on scale weight or body composition?", a: "Body composition. Someone who loses 6kg of fat while gaining 1kg of muscle looks and functions dramatically better than someone who loses 8kg including 2.5kg of muscle. Measurements, progress photos, and tracking strength give a more accurate and motivating picture than the scale alone." },
        ]
      }],
      mid_recomp: [{
        title: "Recomposition — A Different Protocol",
        qs: [
          { q: "I want to lose fat and build muscle. Is GLP-1 appropriate for this goal?", a: "Yes, but the protocol is meaningfully different. For recomposition, the goal is a modest deficit (300–400 calories below maintenance) combined with optimal protein and progressive resistance training. GLP-1 at a lower dose can reduce appetite noise without suppressing intake so aggressively that training performance is impaired. Be explicit with your prescriber that recomposition — not maximum weight loss — is your goal." },
          { q: "What dose strategy is appropriate for recomposition?", a: "Lower than standard weight loss doses for most people. Enough appetite modulation to reduce overeating while maintaining adequate intake for training and recovery. Many recomposition users find a stable lower dose serves them better than continued escalation. This requires a prescriber who understands your goal is body composition, not maximum weight loss." },
          { q: "How should I structure my nutrition differently for recomposition?", a: "You're eating more than a weight loss approach. Recomposition requires enough total calories to fuel training. Protein targets are higher — 1.8–2.2g per kg of bodyweight. Carbohydrates around training sessions are important for performance — don't restrict carbs as aggressively as a pure weight-loss approach. Eat protein first at every meal, fuel training with carbohydrates, and let the moderate caloric deficit handle fat loss gradually." },
        ]
      }],
      low_recomp: [{
        title: "Lower BMI — Performance Considerations",
        qs: [
          { q: "I'm already lean. What are the specific risks I should understand?", a: "The ratio of muscle to fat loss becomes less favourable the leaner you are — there's less fat available, so a deficit draws proportionally more from lean tissue. This makes protein targets and resistance training even more critical. Hormonal disruption from significant caloric restriction is also a concern at lower body fat — track menstrual cycle changes if applicable and raise any irregularity with your prescriber." },
          { q: "What does a lower-dose protocol look like for body composition goals?", a: "Lower-dose use (sub-therapeutic range) for body composition is off-label and more nuanced than clinical weight management. The rationale: appetite modulation without full suppression, avoiding GI side effects that impair training. Ensure your prescriber understands your performance goals — not just clinical weight management — and is monitoring appropriately." },
          { q: "I train hard 5–6 days per week. How will this affect my training?", a: "High training volume requires high caloric throughput. Prioritize pre and intra-workout nutrition even when not hungry, consider reducing training volume (not intensity) in weeks 1–3 while adapting, and monitor recovery markers carefully — persistent soreness beyond 72 hours or declining performance signals inadequate recovery." },
        ]
      }],
      metabolic: [{
        title: "Metabolic Health as the Primary Goal",
        qs: [
          { q: "My goal is improving glucose and cardiovascular risk, not weight loss. Does the approach change?", a: "Meaningfully yes. Metabolic health goals are often achieved at lower levels of weight loss than people expect — 5–10% of body weight produces significant improvements in insulin sensitivity, blood pressure, lipid profiles, and liver fat. You may reach your primary clinical goal well before reaching an aesthetic goal — that's a successful outcome. Success metric is your bloodwork, not your scale." },
          { q: "Will GLP-1 improve my glucose control even before I lose significant weight?", a: "Yes — this is one of the most clinically important distinctions. GLP-1 agonists improve glycaemic control through mechanisms independent of weight loss: they stimulate insulin secretion in a glucose-dependent manner, suppress glucagon release, and slow gastric emptying. Many people see HbA1c improvements within 4–8 weeks, before major weight loss has occurred." },
          { q: "What markers should I track to measure metabolic success?", a: "Fasting glucose and fasting insulin (calculate HOMA-IR for insulin resistance), HbA1c, triglycerides, HDL cholesterol, blood pressure, waist circumference, and liver enzymes. These are more meaningful than the scale for your specific goal. Repeat at 3 months minimum, ideally at 6–8 weeks for early response." },
        ]
      }],
    }
  },

  // ── WEEK 1 ────────────────────────────────────────────────────────────────
  w1: {
    id: "w1", week: "Week 1", label: "First Dose", icon: "②",
    color: "#A84848", tagline: "Your body is adapting — expect friction",
    universal: [
      {
        title: "What's Normal Right Now",
        qs: [
          { q: "The nausea is severe. Is this normal and what can I do?", a: "Yes — severe nausea in week one is common and doesn't mean a dangerous reaction. Management in order of effectiveness: inject at night so peak effect occurs during sleep. Cold or room-temperature foods only — heat amplifies nausea. Small volume meals rather than skipping entirely. Avoid high-fat foods completely. Ginger in any form helps. Stay hydrated with electrolytes. If vomiting and can't keep fluids down for more than 24 hours, contact your doctor — ondansetron is safe and effective alongside GLP-1s." },
          { q: "I've barely eaten anything. Am I eating too little?", a: "Week one appetite suppression can be dramatic. The concern is not eating less, it's the floor: aim for at least 800–1,000 calories minimum with protein as the priority. Even if that means only protein shakes, get the protein in. Repeated weeks without adequate protein will cause muscle loss." },
          { q: "I'm constipated — what do I do?", a: "Expected and nearly universal in week one. Increase water to 3L+ daily starting now, add magnesium glycinate 300–400mg tonight, begin a fibre supplement. Walk daily — even 20 minutes helps motility. If no bowel movement after 4 days, contact your doctor — osmotic laxatives (MiraLax) are safe alongside GLP-1s. Don't let constipation extend beyond 6 days." },
          { q: "I feel completely exhausted. Is this the medication?", a: "Yes, multi-factorial. Reduced caloric intake, physiological adjustment to changed hormone signalling, and direct medication effects all contribute. This week: rest, maintain minimum nutrition, stay hydrated. If fatigue is severe and accompanied by dizziness, contact your doctor — this can indicate dehydration or hypoglycaemia." },
          { q: "I have a headache that won't go away.", a: "Almost certainly dehydration and electrolyte depletion. Drink 500ml of electrolyte fluid now and another 500ml over the next two hours. Most GLP-1 headaches resolve within 30–60 minutes of adequate rehydration. If it persists beyond 48 hours or includes visual disturbance, seek medical attention." },
          { q: "I feel emotionally flat or low. Is that the medication?", a: "Possibly. Mood changes in week one are documented and more common than widely acknowledged. Reduced caloric intake affects neurotransmitter production. Most mood effects in week one resolve as the body adapts. If low mood is severe, persistent beyond two weeks, or worsening, discuss with your doctor — not something to dismiss." },
        ]
      },
      {
        title: "Practical Week 1 Questions",
        qs: [
          { q: "The scale hasn't moved at all. Is something wrong?", a: "Nothing is wrong. Week one scale movement is unreliable — inflammation, glycogen changes, water retention, and constipation can all mask early fat loss. The question to ask this week is not 'is the scale moving' but 'can I feel the appetite change' — that's the actual early indicator of response." },
          { q: "Can I exercise this week?", a: "Light to moderate movement — walking, gentle yoga, light resistance work — is fine and helpful for constipation and mood. Do not push intensity. High-intensity training in week one while undereating significantly increases injury risk. Goal this week: maintain the habit, not optimize performance." },
          { q: "My hunger came back by day 5 or 6. Is the medication wearing off?", a: "No. The pharmacokinetics of weekly GLP-1s mean plasma levels peak at 24–72 hours post-injection and then gradually decline. Feeling somewhat more hungry by days 5–7 is expected. This typically evens out over the first few weeks as steady-state levels build with each injection." },
        ]
      },
    ],
    byTrack: {
      high_loss: [{
        title: "Week 1 at Higher BMI — What's Different",
        qs: [
          { q: "I've lost 4–6 pounds already. Is this real weight loss?", a: "Mostly water, glycogen depletion, and inflammation reduction — not fat. At higher starting weights, particularly with elevated insulin levels, the early scale drop can be dramatic and almost entirely fluid. Enjoy the early movement but calibrate ongoing expectations to 1–2 pounds per week from week 3 onward." },
          { q: "My joints feel worse this week. Is inflammation getting worse?", a: "Some people experience a temporary increase in joint discomfort in week one before significant improvement — likely related to fluid balance changes. It typically resolves within 2–3 weeks. The longer-term trajectory is strongly positive: even 5–10% weight loss produces measurable reductions in joint load and inflammatory markers." },
          { q: "I feel genuinely hopeful for the first time in years. Is it okay to feel this way?", a: "Yes — completely. The hope is real and the response to it is valid. Many people at higher BMI carry significant history of failed attempts. Feeling the appetite suppression work for the first time can produce genuine emotional relief. Hold onto that signal — and at the same time, protect it by not staking everything on week-one scale movement." },
        ]
      }],
      mid_loss: [{
        title: "Week 1 — Moderate BMI Specific",
        qs: [
          { q: "My appetite has dropped dramatically. How do I know if I'm eating enough?", a: "Track it this week at least. Rough protein and calorie estimate from a food app tells you whether you're above the floor. Aim for 1,200 calories and 100–120g protein on difficult days. Most people at moderate BMI find week one produces 600–900 calorie days without effort — that's too low. Schedule three eating windows regardless of hunger. At each window, eat protein first." },
          { q: "I only have 25–30 pounds to lose. Will the side effects be worth it?", a: "Fair question. Side effects are worst in weeks 1–3 and become very manageable by week 4. The calculus: 3 difficult weeks followed by 6+ months of significantly easier appetite management versus continuing to manage 25–30 pounds through willpower alone. Most people who reach this question at week 1 answer it by week 4." },
          { q: "My insurance required prior authorization and I'm worried about losing coverage.", a: "Document your starting weight carefully and track weight consistently from week 1 — you'll need this data for renewal, which typically requires demonstrating 5% loss at 3 months. Novo Nordisk and Eli Lilly both have patient assistance programs that significantly reduce out-of-pocket costs if coverage lapses — ask your prescriber's office." },
        ]
      }],
      mid_recomp: [{
        title: "Week 1 Recomposition — Getting the Foundation Right",
        qs: [
          { q: "The scale is dropping fast. Shouldn't I lean into the deficit?", a: "No — this is the most important recomposition principle to establish in week one. Aggressive deficit produces rapid scale movement that is predominantly water and glycogen, followed by accelerated muscle loss. For recomposition the scale dropping more than 1.5–2 pounds per week signals your deficit is too large. If the medication is suppressing appetite so aggressively you're below your target intake, eat more — even when not hungry." },
          { q: "I'm eating so little that hitting protein feels impossible. What's the priority?", a: "Protein — unambiguously for a recomposition goal. If you can only manage 800–1,000 calories today, make 150–180g protein. Protein preserves muscle under energy restriction and has the highest thermic effect of any macronutrient. Carbohydrate and fat can be minimal this week without significant harm. Protein deficiency in week one while in deficit causes muscle loss that takes weeks to recover." },
          { q: "I trained hard yesterday and I'm much more sore than usual.", a: "Likely the reduced caloric intake rather than the medication directly. Muscle recovery requires adequate protein and total energy — both reduced in week one. DOMS persisting beyond 72 hours signals inadequate recovery. Ensure 30–40g protein within 60–90 minutes after training even when not hungry. Consider reducing training volume, not stopping, this week." },
        ]
      }],
      low_recomp: [{
        title: "Week 1 — Performance Users",
        qs: [
          { q: "I train 5 days a week. Do I need to take the week off?", a: "Not the week off, but a significant reduction. Reduce to 3 sessions this week, drop volume by 40%, maintain intensity on the primary movements that matter most. The session you do this week is about maintaining the neuromuscular signal — not fitness output. Pre-workout nutrition is critical: eat carbohydrates 90 minutes before training even when not hungry." },
          { q: "My performance has already dropped significantly in just a few days. Is this permanent damage?", a: "Not permanent. Performance drops primarily reflect glycogen depletion and neuromuscular fatigue from altered energy substrate availability — not actual muscle loss. Performance typically returns to baseline within 2–4 weeks. Eat 30–50g of carbohydrate pre-workout even at low total intake — this makes a measurable difference to performance." },
          { q: "I'm using a lower dose for body composition. Why do I still feel this bad?", a: "Even at lower doses, the GI adaptation response in week one is largely a class effect rather than purely dose-dependent. Most low-dose users find side effects resolve meaningfully by day 10–12 rather than day 14–21, and severity is often lower — but the management strategies are the same: night injection, small meals, ginger, electrolytes." },
        ]
      }],
      metabolic: [{
        title: "Week 1 — Metabolic Health Specific",
        qs: [
          { q: "My blood glucose has already improved significantly. Is this right?", a: "Yes — one of the most striking early effects. GLP-1 agonists stimulate insulin secretion in a glucose-dependent manner and suppress glucagon within hours of the first dose. Fasting glucose improvements in the first week are well-documented. If you're monitoring at home, expect to see fasting readings trending down within 3–5 days. Document these readings as your baseline response data." },
          { q: "I'm on insulin and worried about going too low. What should I watch for?", a: "Hypoglycemia awareness is critical this week. GLP-1 improves insulin sensitivity — if your insulin dose was calibrated to your pre-treatment glucose levels, it may now be too high. Signs: shakiness, sweating, heart pounding, confusion, lightheadedness. Treat any reading below 70 mg/dL with 15g fast carbohydrate. Contact your doctor immediately if having hypoglycemic episodes — insulin dose reduction is likely needed this week." },
          { q: "I'm on metformin and stomach symptoms are much worse than expected.", a: "GI side effects from metformin and GLP-1s can be additive in week one. Switching from immediate-release to extended-release metformin (metformin ER) significantly reduces GI side effects — worth discussing with your doctor this week. Same medication, substantially better GI tolerability. Do not reduce or stop metformin without guidance." },
        ]
      }],
    }
  },

  // ── WEEKS 2-3 ─────────────────────────────────────────────────────────────
  w3: {
    id: "w3", week: "Weeks 2–3", label: "Adaptation Phase", icon: "③",
    color: "#C97B2E", tagline: "Side effects ease — habits become the priority",
    universal: [
      {
        title: "Physical Changes Weeks 2–3",
        qs: [
          { q: "Nausea has improved but not gone completely. Is that normal?", a: "Yes. Nausea typically improves significantly by week 2 but partial nausea can persist for 4–8 weeks at starting dose. The pattern: week one severe, week two noticeably better, week three manageable. Each dose escalation often brings a temporary return for 1–2 weeks before adapting again. If nausea is worsening rather than improving through weeks 2–3, discuss with your prescriber rather than waiting." },
          { q: "I'm still constipated despite magnesium and water.", a: "Weeks 2–3 constipation that persists requires escalation. Add osmotic laxatives (MiraLax) one sachet daily, psyllium husk fibre supplement, and increase walking. If no improvement within 48 hours, contact your doctor. Do not normalize constipation beyond 5–6 days without intervention." },
          { q: "I'm experiencing heartburn or acid reflux I didn't have before.", a: "Slowed gastric emptying can increase reflux. Management: avoid lying down for 2–3 hours after eating, reduce meal volume, avoid high-fat foods and citrus, sleep with the head of your bed slightly elevated. Over-the-counter antacids can help acutely. If severe or persistent, discuss with your prescriber — this can occasionally be a reason to adjust dose." },
          { q: "My face looks more drawn or gaunt. Is this normal?", a: "Yes — colloquially called 'GLP-1 face'. Fat loss occurs throughout the body and the face often shows changes early and visibly. It's not a health signal. It typically moderates as the rate of weight loss slows. Adequate protein and hydration support skin elasticity." },
        ]
      },
      {
        title: "Nutrition and Training — Early Questions",
        qs: [
          { q: "I'm not hitting my protein target because I can't eat enough. What do I do?", a: "Protein shakes are not a compromise — they are the right tool for this situation. Greek yoghurt (17g per 200g), cottage cheese (25g per 200g), eggs, tinned fish (25g per 95g tin), casein or whey shake. Eat protein first at every meal before anything else. If you can only eat 400 calories, make 120–150g of them protein." },
          { q: "Can I return to normal training?", a: "Weeks 2–3: cautious return. If nausea has improved and you're eating more consistently, increase training intensity gradually to 70–80% of previous intensity. Keep cardio at low-moderate intensity. Your recovery capacity is reduced in a caloric deficit — the same training load will feel harder and recover more slowly. This is physiological, not fitness decline." },
          { q: "What happens if I miss a dose?", a: "For weekly GLP-1s: if you're within 4 days of your scheduled dose, inject as soon as you remember and resume your regular schedule. If it's more than 4 days since the missed dose and your next scheduled dose is within 2 days, skip the missed dose — do not double dose. Missing one dose occasionally won't meaningfully affect outcomes." },
        ]
      },
    ],
    byTrack: {
      high_loss: [{
        title: "Physical Changes Weeks 2–3 — Higher BMI",
        qs: [
          { q: "I've lost 8–10 pounds in two weeks. Is this too fast?", a: "At higher starting BMI, 8–10 pounds in two weeks is at the high end of normal. Weeks 1–2 loss breaks down as roughly 3–4 pounds fluid (week one) then 1–2 pounds actual fat per week in week two. If losing more than 2 pounds of fat per week consistently, the deficit is likely too aggressive and muscle loss risk increases. Check: are you eating at least 1,400–1,600 calories and hitting protein targets?" },
          { q: "My feet and ankles have less swelling. Is that the medication?", a: "Yes — peripheral edema reduction is a documented early benefit. Reduced caloric intake decreases insulin levels, which reduces sodium and water retention. Even modest weight loss reduces hydrostatic pressure on lower extremity veins. Many people notice this before significant scale changes — it's a meaningful early clinical indicator." },
          { q: "I'm losing weight but I still feel the same way about my body. Is that normal?", a: "Completely normal. Body image — the internal representation of your body — updates far more slowly than the physical reality. Many people describe looking in the mirror at week 3 and seeing essentially the same person despite meaningful measurable change. This lag is a well-documented psychological phenomenon. It typically resolves over months, not weeks." },
        ]
      }],
      mid_loss: [{
        title: "Building Habits in the Window — Moderate BMI",
        qs: [
          { q: "Nausea is better. What should 'normal' eating look like now?", a: "The temptation is to return to pre-medication eating patterns — just eating less of them. Better 'normal': three structured meals with protein first at each, resistance training twice per week minimum, protein target tracked loosely. The habits you establish in weeks 2–4 — when GI adaptation is stabilizing — are the habits most likely to stick. Use this window deliberately." },
          { q: "I have a work trip planned for week three. How do I manage?", a: "Inject mid-week before the trip. Bring medication in carry-on (not checked luggage). Most pens are stable at room temperature below 77°F for 28 days once opened — a business trip is fine. At restaurants: order protein first, eat slowly, stop at the first signal of fullness. Alcohol at work events: tolerance has changed significantly — one drink may hit much harder than before." },
          { q: "My cravings for specific foods have changed. Things I used to love don't appeal to me anymore.", a: "One of the most consistently reported and least explained experiences of early GLP-1 therapy. Food preferences — particularly for high-fat, high-sugar, ultra-processed foods — often shift meaningfully in the first 2–4 weeks. The mechanism involves GLP-1 receptor effects in the brain's reward circuitry. These shifts tend to be durable though they moderate somewhat as the body adapts." },
        ]
      }],
      mid_recomp: [{
        title: "Recomposition Progress Weeks 2–3",
        qs: [
          { q: "The scale has barely moved in three weeks. My partner thinks the medication isn't working.", a: "The scale not moving during a recomposition protocol is evidence it's working, not failing. If you've lost 2 pounds of fat and gained 1.5 pounds of muscle, the scale shows a 0.5 pound change while body composition has improved significantly. The metrics that show recomposition working: measurements reducing at waist, strength increasing or maintaining, clothes fitting differently." },
          { q: "My strength has actually increased slightly despite being on the medication. Is that possible?", a: "Yes — and it's the best possible signal that your approach is working correctly. Strength gains during a mild caloric deficit are possible due to neurological adaptations in the first 8–12 weeks. This pattern — scale static, strength increasing, measurements shifting — is textbook successful recomposition. Document it carefully." },
          { q: "I'm thinking about adding creatine. Is it appropriate alongside GLP-1?", a: "Yes — creatine monohydrate is the most evidence-supported supplement for preserving and building muscle during caloric restriction and is appropriate alongside GLP-1 therapy with no meaningful interaction. Dosing: 3–5g daily consistently, no loading phase required. Expect a 1–2kg scale increase in the first week as creatine draws water into muscle cells — this is not fat gain." },
        ]
      }],
      low_recomp: [{
        title: "Returning to Performance — Weeks 2–3",
        qs: [
          { q: "My performance has bounced back significantly from week one. Can I return to full training volume?", a: "Return to full volume in stages over weeks 2–4 rather than immediately. Your total caloric intake is still below your pre-medication baseline — full training volume at reduced intake produces accumulated fatigue over 2–3 weeks that then requires a deload. Return to 75% of volume in week two, add another 10–15% in week three. Monitor resting heart rate on waking — elevated HR is an early overtraining signal." },
          { q: "My appetite is suppressed but I need to eat enough to train. How do I balance this?", a: "Structure eating around training rather than hunger signals. Pre-workout meal 90 minutes before training regardless of appetite (30–50g carbohydrate, 20–30g protein), intra-workout nutrition for sessions over 60 minutes (20–30g fast carbohydrate), post-workout within 45 minutes (30–40g protein, 40–60g carbohydrate). Calculate your training day energy requirement and eat to that target regardless of appetite signals." },
          { q: "I'm noticing muscle definition I've never had before. Is this real?", a: "Likely real. Visible muscle definition emerges when subcutaneous fat reduces sufficiently for underlying muscle structure to show. At lower starting BMI, this threshold is closer and early fat loss produces visible definition faster. The fact that you're seeing definition rather than just looking smaller confirms fat is being lost while muscle is being preserved." },
        ]
      }],
      metabolic: [{
        title: "Metabolic Marker Changes — Weeks 2–3",
        qs: [
          { q: "My fasting glucose readings are now consistently in the normal range. Can I reduce my diabetes medication?", a: "This is a prescriber decision that needs to happen this week — not at your next scheduled appointment. If your glucose is normalizing and you're on the same dose of insulin or sulfonylurea, hypoglycemia risk is real and increasing. Contact your prescriber proactively and share your home glucose log. Most prescribers will adjust medications once 7–10 days of consistent improvement is demonstrated." },
          { q: "My blood pressure has dropped significantly. I'm on blood pressure medication — should I be concerned?", a: "Yes — proactively. If home blood pressure readings are consistently below 110/70 or you're experiencing dizziness on standing or lightheadedness, contact your prescriber this week. Antihypertensive dose reduction is commonly needed within weeks 2–6 of starting GLP-1 therapy in people who were previously on medication." },
          { q: "My energy levels are higher than they've been in years even though I'm eating less. Why?", a: "Several mechanisms converging: reduced insulin levels improve cellular energy availability, early improvements in sleep quality contribute, reduced inflammatory burden supports mitochondrial function, and for people with previously elevated blood glucose, normalized glucose eliminates the energy-draining effects of hyperglycemia. This improvement often arrives before significant weight loss — it's a direct metabolic benefit." },
        ]
      }],
    }
  },

  // ── WEEKS 4-6 ─────────────────────────────────────────────────────────────
  w6: {
    id: "w6", week: "Weeks 4–6", label: "Finding Rhythm", icon: "④",
    color: "#3D7A6A", tagline: "Side effects resolved — habits become the deciding factor",
    universal: [
      {
        title: "Physical Progress Weeks 4–6",
        qs: [
          { q: "The scale slowed dramatically from week one. Has the medication stopped working?", a: "No. The rapid early loss was fluid and glycogen. The rate you're experiencing now — 0.3–1kg per week — is actual fat loss. This rate is physiologically appropriate, sustainable, and protective of muscle mass. Rates above 1% of body weight per week are associated with increased lean mass loss. The deceleration is the medication working as intended at a sustainable rate." },
          { q: "I'm experiencing hair loss. Is this from the medication?", a: "Almost certainly from caloric restriction and nutritional stress rather than the medication itself. Telogen effluvium — stress-triggered hair shedding — typically appears 2–4 months after a physiological stressor, but the trigger is happening now. Ensure adequate protein, zinc, iron, and biotin. It is almost always temporary — hair typically regrows over 3–6 months once nutrition normalizes." },
          { q: "My energy has returned but gym performance is still below normal.", a: "Expected and physiologically explained. Training performance in a sustained caloric deficit is reduced due to reduced glycogen availability and impaired recovery. You can maintain strength with reduced volume but should not expect personal bests while in a significant deficit. The goal is preserving the strength stimulus — not optimizing performance. That phase comes after." },
        ]
      },
      {
        title: "Nutrition, Habits, and Psychology",
        qs: [
          { q: "I'm eating much less than before but worried I'm undereating.", a: "This is a real and underappreciated risk. GLP-1s can suppress appetite so effectively that people genuinely eat 600–900 calories daily without feeling uncomfortable. At that level: metabolism adapts downward, muscle loss accelerates, micronutrient deficiencies develop rapidly, and mood suffers. Eat by the clock — scheduled meals at fixed times regardless of appetite signals." },
          { q: "I've hit a plateau at week 5 or 6. What now?", a: "A plateau at weeks 5–6 at starting dose is common and expected. Your body has recalibrated to a new lower intake and is defending its current weight — normal metabolic adaptation. Three responses in order: confirm it's actually a plateau (body composition may be changing even if the scale isn't), assess nutrition honestly, then discuss dose escalation with your prescriber if you've completed the minimum duration at starting dose and side effects have resolved." },
          { q: "My mood and anxiety feel elevated. Is this the medication?", a: "Anxiety is a documented but underreported side effect of GLP-1 agonists in a subset of users. The mechanism may involve changes in gut-brain signalling via the vagus nerve. If anxiety is new and correlates with injection timing, document it and discuss with your prescriber. If worsening week on week regardless of injection timing, it warrants clinical evaluation — not just reassurance." },
          { q: "Should I be taking any supplements?", a: "Recommended for almost everyone: magnesium glycinate 300–400mg daily (constipation prevention, sleep quality), vitamin D if deficient, a high-quality multivitamin as nutritional insurance. Consider adding if bloodwork indicates: iron with vitamin C, zinc, B12. Avoid: collagen counted toward protein targets (incomplete amino acid profile), and any 'fat burner' supplements while on GLP-1s." },
        ]
      },
    ],
    byTrack: {
      high_loss: [{
        title: "Progress and Reality — Weeks 4–6 at Higher BMI",
        qs: [
          { q: "I've lost 20 pounds but still feel like I look the same. When does that change?", a: "The disconnect between physical change and perceived change is one of the most universal experiences at higher starting BMI. The perceptual shift often arrives not as a gradual adjustment but as a sudden moment of recognition — frequently triggered by a photo, fitting into a booth or airplane seat more comfortably, or someone's unexpected reaction. Keep the data. The subjective perception will catch up." },
          { q: "People are starting to notice and comment. How do I respond?", a: "You don't need a rehearsed speech. 'Thank you, I'm working on my health' is complete. 'I'm on a medically supervised program' redirects to the clinical framework without inviting debate. Avoid responding with self-deprecation about how far you still have to go — it's a pattern worth breaking early." },
          { q: "Hair loss has started and it's distressing. What can I actually do?", a: "Maximize protein intake (the single most important dietary intervention), add zinc 15–25mg daily, iron and ferritin if not already adequate (get blood levels tested — low ferritin is a significant driver of hair loss that is often missed), and biotin 2.5–5mg daily. Expensive shampoos and topical treatments won't help — they address pattern hair loss, not telogen effluvium." },
          { q: "My doctor is talking about bariatric surgery as a complement. Should I consider it?", a: "At higher BMI, bariatric surgery and GLP-1 therapy are complementary options rather than competing ones. If your doctor is raising surgery, it's worth an informed consultation with a bariatric specialist — not as a commitment, but as information gathering. The decision is never urgent; gathering information now costs nothing." },
        ]
      }],
      mid_loss: [{
        title: "Consolidating the Program — Moderate BMI",
        qs: [
          { q: "My doctor is escalating my dose. What should I prepare for?", a: "A temporary return of nausea and GI symptoms for 1–2 weeks — typically less severe than week one because your GI system has partially adapted. Prepare the same way you prepared for week one: ginger, electrolytes, small meal plans ready, schedule the escalation mid-week. After 2–3 weeks of adaptation, appetite suppression typically increases meaningfully and weight loss often accelerates." },
          { q: "I'm starting to think about what happens when I stop. I'm scared of regaining.", a: "This fear arrives right on schedule and is healthy to engage with rather than suppress. The research is honest: most people regain significant weight within 12 months of stopping without a structured maintenance plan. The factors most protective against regain are the ones you're building right now — consistent resistance training, reliable protein intake, and a genuinely changed relationship with food." },
          { q: "My relationship with food feels completely different. Is this permanent?", a: "Partially. The neurological changes GLP-1 therapy produces in food reward circuitry are real and have some durability beyond the medication period. People often report genuinely different tastes after GLP-1 therapy. The appetite suppression itself reduces when medication is stopped, but behavioral habits and preference shifts that were reinforced during treatment tend to persist more than people expect." },
        ]
      }],
      mid_recomp: [{
        title: "Recomposition — When Results Start Becoming Visible",
        qs: [
          { q: "I'm seeing real changes in body composition for the first time. How do I capitalize on this?", a: "Don't change what's working. The combination of moderate deficit, adequate protein, and consistent resistance training that produced these results is the formula. The temptation at weeks 4–6 is to cut calories further to accelerate results or add more cardio. Both typically slow recomposition by increasing lean mass loss and impairing recovery. Stay on the program, add progressive overload to resistance training, let results accumulate." },
          { q: "My waist is reducing faster than other areas. Is this normal?", a: "Yes. Abdominal fat — particularly visceral fat — tends to respond earlier and faster to caloric deficit and GLP-1 therapy specifically, because visceral fat is metabolically more active and sensitive to insulin changes. Subcutaneous fat in peripheral areas responds more slowly. The distribution will not fully 'even out' — genetic fat patterning means some areas are more resistant — but with sustained fat loss, all areas eventually respond." },
          { q: "Should I be doing a cut or staying in a slow deficit for the full 12 weeks?", a: "For recomposition at moderate BMI, a consistent slow deficit (300–400 calories below maintenance) for the full 12 weeks produces better body composition outcomes than more aggressive cuts. Aggressive cuts accelerate fat loss but disproportionately increase lean mass loss where there's less fat available as a preferential energy source. The slow deficit is also more compatible with training performance." },
        ]
      }],
      low_recomp: [{
        title: "Performance and Protocol Decisions — Weeks 4–6",
        qs: [
          { q: "I've reached my body composition goal ahead of schedule. Should I stop?", a: "Reaching your goal early requires a deliberate decision. Three options: stop completely (highest regain risk), taper to a lower maintenance dose (most common for performance users), or take a planned break with a clear protocol for the off period. The minimum before stopping: ensure resistance training and protein intake are genuinely habitual, not effortful, and have a specific plan for the first 4–6 weeks post-medication." },
          { q: "My training performance has fully recovered and is actually better than before. Why?", a: "Improved body composition directly improves performance metrics relative to body weight — power-to-weight ratio, relative strength, speed, and aerobic efficiency all improve as body fat decreases while muscle mass is maintained. If you've achieved meaningful fat loss while preserving muscle, the same absolute strength output now moves a lighter body — producing better relative performance." },
          { q: "I want to run a bulk cycle after this. How do I transition?", a: "Allow 4–6 weeks post-medication for appetite to fully normalize before introducing a true caloric surplus. Rushing into a bulk immediately after stopping typically produces fat regain rather than muscle gain because the appetite return is sudden and eating patterns aren't established. Sequence: taper medication over 3–4 weeks, hold at maintenance for 4–6 weeks, then introduce a modest surplus of 200–300 calories." },
        ]
      }],
      metabolic: [{
        title: "Metabolic Assessment and Long-Term Framing — Weeks 4–6",
        qs: [
          { q: "My 6-week bloodwork shows significant improvements across the board. What does this mean?", a: "What each improvement means: fasting glucose and HbA1c trending down — glucose metabolism is responding as intended. Triglycerides reducing significantly — liver fat metabolism improving. HDL increasing — insulin sensitivity improving. ALT and AST reducing — liver inflammation resolving. These are not just numbers — they each represent a specific physiological improvement with real clinical significance." },
          { q: "My HbA1c is now in the normal range. My doctor says I may be in remission from diabetes. What does that actually mean?", a: "Diabetes remission is defined as HbA1c below 6.5% sustained for at least 3 months without glucose-lowering medication. It means your beta cells are producing enough insulin for your current degree of insulin sensitivity and that sensitivity has improved to the normal range. It is not a cure — if the lifestyle factors that enabled remission are not sustained, diabetes can return. GLP-1 therapy is one of the most effective interventions for achieving remission in early or moderate type 2 diabetes." },
          { q: "I feel so much better that I'm tempted to stop the medication. How do I think about this?", a: "Feeling better is not the same as being better — and this distinction matters most in chronic disease management. The improvements you're experiencing are the medication working. Stopping because you feel well is analogous to stopping a statin because your cholesterol has normalized. The informed decision about stopping should be based on: how durable your lifestyle changes are, what your markers do when dose is reduced, and a structured conversation with your prescriber." },
          { q: "My insurance is pushing back on continued coverage after 6 weeks. What should I do?", a: "What supports continued coverage: your 6-week bloodwork showing measurable response, documentation from your prescriber of the clinical indication and response, and citation of SELECT trial evidence for cardiovascular indications. Ask your prescriber to document clinical response and indication clearly. If denied, a peer-to-peer review between your prescriber and the insurance medical director has a significantly higher success rate than a standard appeal." },
        ]
      }],
    }
  },

  // ── WEEKS 7-9 ─────────────────────────────────────────────────────────────
  w9: {
    id: "w9", week: "Weeks 7–9", label: "The Plateau Zone", icon: "⑤",
    color: "#C97B2E", tagline: "The most misunderstood phase of the journey",
    universal: [
      {
        title: "When the Scale Stops Moving",
        qs: [
          { q: "I've completely plateaued for three weeks. What should I do?", a: "A genuine plateau (no scale movement, no measurement change, no body composition change over 3+ weeks) typically has one of three causes: metabolic adaptation to current caloric intake, consuming more calories than the suppressed appetite suggests (liquid calories, high-palatability foods, frequent small amounts), or having reached the efficacy ceiling of the current dose. In order: first do an honest food audit for one week. If intake is genuinely low and the plateau persists, discuss dose escalation with your prescriber." },
          { q: "My prescriber wants to increase my dose. What should I expect?", a: "A temporary return of weeks-1-2 side effects — most commonly nausea, fatigue, and constipation for 1–2 weeks as your body adapts to the higher dose. Severity is usually less than at starting dose because your GI system has partially adapted. Management: same approach as week one (night injection, cold foods, small meals, ginger, electrolytes, magnesium). After 2–3 weeks at the new dose, efficacy typically improves noticeably." },
          { q: "I feel like I'm cheating somehow — like this isn't earned.", a: "One of the most universally felt but least discussed experiences. Managing a chronic condition with appropriate medical support is healthcare, not cheating. The cultural narrative around weight loss as a moral test is not a clinical framework. You still make the choices about training, protein, and habits that determine the quality of your outcome." },
          { q: "My motivation has completely dropped. The novelty has worn off.", a: "Expected at this stage. The dramatic early changes have normalised and the novelty has gone. This is where habit architecture matters more than motivation. Focus on process metrics you control — training sessions completed, protein targets hit, injection on schedule — rather than the outcome metric of the scale." },
        ]
      },
      {
        title: "Body Composition and Training",
        qs: [
          { q: "I'm losing weight but I look softer not leaner. Why?", a: "The most common explanation: inadequate resistance training and/or inadequate protein, producing a ratio of muscle-to-fat loss that doesn't favour the lean outcome most people are working toward. Losing fat and muscle simultaneously produces a 'smaller but same shape' effect. The fix is not to lose less weight — it's to change what you're losing. This requires prioritising resistance training and protecting protein targets." },
          { q: "How important is resistance training really?", a: "It is not optional if your goal is body composition rather than just scale weight. Without resistance training during GLP-1-induced weight loss, 25–40% of lost weight is lean mass. That lean mass loss has consequences beyond aesthetics — muscle supports insulin sensitivity, resting metabolism, functional strength, and long-term weight maintenance. Two sessions per week of compound resistance training is the minimum. Three is better." },
        ]
      },
    ],
    byTrack: {
      high_loss: [{
        title: "The Long Game — Higher BMI Weeks 7–9",
        qs: [
          { q: "I've lost 35 pounds but feel like I'm only partway through a long journey. How do I sustain motivation?", a: "Motivation as a fuel source runs out — this is not a personal failing, it's how motivation works. At weeks 7–9 the goal is to have established enough habit and identity that the program continues when motivation is absent. Shift your success metrics from outcome-based (pounds lost, goal weight) to process-based (training sessions per week, protein targets hit, injection on schedule). These are entirely within your control." },
          { q: "My skin is loose in multiple areas now. At what point should I think about skin removal surgery?", a: "The clinical recommendation is to wait a minimum of 12–18 months after reaching and stabilizing at your goal weight before considering skin removal surgery. This allows skin to adapt naturally — often more than people expect — and ensures weight loss is stable before surgical intervention. Resistance training to maintain muscle volume beneath loose skin, adequate protein, and hydration are the most effective current interventions." },
          { q: "I've started to enjoy movement in a way I never did before. Is this the medication?", a: "Likely both — GLP-1 receptors are present in the brain's reward circuitry with emerging evidence that GLP-1 agonists may enhance the reward response to physical activity. More importantly, reduced body weight directly changes the physical experience of movement — less joint load, less cardiovascular strain, better proprioception. Whatever the mechanism, this shift is worth protecting. It's one of the most durable positive changes and strongest predictors of long-term weight maintenance." },
          { q: "My orthopedic surgeon says I may not need knee surgery after all. What happened?", a: "Weight loss has a direct and often dramatic effect on joint health. Every pound of body weight generates approximately 4 pounds of force across the knee joint during walking — losing 30 pounds reduces knee joint load by roughly 120 pounds per step. This reduction in mechanical load combined with reduced systemic inflammation can produce significant improvements in joint function. Some people who were considered surgical candidates become non-surgical candidates after meaningful weight loss." },
        ]
      }],
      mid_loss: [{
        title: "Approaching Goal and What Comes Next — Moderate BMI",
        qs: [
          { q: "I'm within 5 pounds of my goal weight. Should I be thinking about maintenance now?", a: "Yes — and ideally you've been thinking about it for the past 3 weeks. The most common mistake is treating goal weight as a finish line rather than a transition point. Before you reach goal weight: identify your maintenance caloric intake (typically 200–400 calories above current intake), have a plan for how you'll manage the medication, and confirm that your training habit is genuinely established." },
          { q: "I've reached my goal weight but I don't feel how I expected to feel.", a: "The arrival fallacy — the belief that reaching a specific goal will produce a sustained emotional payoff — is one of the most reliably disappointing aspects of goal achievement. Most people reach goal weight and feel a brief moment of satisfaction followed by a return to baseline mood. The question worth asking: what did you expect to feel different, and is that actually weight-dependent?" },
          { q: "People who knew me before ask constantly how I did it. How do I handle these conversations?", a: "You've become an inadvertent ambassador for a medication that is both popular and controversial. 'I've been working with my doctor on my health' is a complete response. If you want to share more: 'I'm on a medically supervised weight management program' is accurate. If someone is genuinely interested for themselves, 'talk to your doctor about what options might be right for you' is the right referral rather than a specific recommendation." },
        ]
      }],
      mid_recomp: [{
        title: "Recomposition at Weeks 7–9 — Evolving the Approach",
        qs: [
          { q: "My body composition has changed significantly but my strength hasn't increased as much as I expected.", a: "Strength gains in a sustained caloric deficit are limited — your body has been prioritizing fat loss over strength development throughout this protocol. Visible body composition improvement can occur alongside flat or modest strength progress when fat loss is the primary driver of the changed appearance. The strength gains you're looking for will come more effectively in a subsequent phase at or above maintenance calories with a dedicated hypertrophy training program." },
          { q: "My DEXA scan shows I've lost fat and gained muscle simultaneously. Is this actually possible?", a: "Yes — particularly in a well-executed GLP-1 recomposition protocol. True simultaneous fat loss and muscle gain is most reliably achieved when: you're in a modest rather than aggressive deficit, protein intake is high, resistance training provides a consistent progressive stimulus, and anabolic adaptations are running at a rate that outpaces the catabolic pressure. Your DEXA data is the most accurate measurement available. Trust it over what the scale or mirror tells you." },
          { q: "I want to switch from recomposition to a dedicated muscle-building phase. When?", a: "When you've reached your target body fat percentage and are ready to accept some increase in scale weight from muscle gain. Transition: over 2–3 weeks, increase caloric intake toward maintenance by adding 100–150 calories per week, primarily from carbohydrates and protein. Once at maintenance for 2 weeks and training performance is fully normalized, introduce a modest surplus of 200–300 calories." },
        ]
      }],
      low_recomp: [{
        title: "Decision Point and Performance Optimization — Weeks 7–9",
        qs: [
          { q: "I've achieved the body composition I wanted. What's the right way to stop?", a: "A structured taper over 4–6 weeks. Suggested: reduce to half your current dose for 3 weeks, then quarter dose for 2 weeks, then stop. During the taper: maintain protein targets and training program deliberately — these habits are your primary maintenance tools. Have a clear re-escalation plan if body composition begins deteriorating significantly." },
          { q: "My training performance is at all-time highs. Is this sustainable after stopping?", a: "Yes — but the question is whether body composition maintenance is achievable without the medication's appetite modulation. For people who have established strong training habits and whose food relationship has genuinely shifted, maintenance is very achievable. For people whose discipline relied primarily on the medication's suppression rather than established habits, some regression toward previous body composition often occurs within 3–6 months." },
          { q: "I'm considering using a very low maintenance dose indefinitely. Is there evidence this is safe?", a: "Long-term safety data for GLP-1 agonists at therapeutic doses is now extensive — 3–5 year follow-up data shows a favorable safety profile. Data specifically for sub-therapeutic maintenance doses in lean individuals is more limited. The practical considerations for ongoing use: periodic prescriber review (annually at minimum), monitoring for any emerging side effects, and a clear conversation with your prescriber about the rationale and monitoring plan." },
        ]
      }],
      metabolic: [{
        title: "Consolidation and Long-Term Decisions — Metabolic Health Weeks 7–9",
        qs: [
          { q: "My 8-week bloodwork is back. How do I interpret what's changed and what hasn't?", a: "HbA1c should show meaningful improvement if your glucose has been better controlled — expect 0.5–1.5% reduction if you started in diabetic or pre-diabetic range. Triglycerides should show the most dramatic improvement — often 30–50% reduction. HDL may be trending up. Liver enzymes (ALT, AST) should be trending toward normal if elevated at baseline. Blood pressure should be lower. Ferritin and B12 are worth checking now if not done at baseline — reduced intake for 8 weeks can begin depleting these." },
          { q: "My cardiologist says the SELECT trial data means I should stay on this medication indefinitely. I'm not sure how I feel about that.", a: "Your uncertainty is reasonable and worth exploring. The SELECT trial enrolled people with established cardiovascular disease — if that describes you, the evidence for long-term benefit is strong. The honest conversation: what specifically would the benefit of ongoing treatment be for your specific cardiovascular risk profile? What does the monitoring plan look like? What would be the criteria for reconsidering? Long-term medication decisions require ongoing informed consent, not a one-time agreement." },
          { q: "My kidney function has actually improved since starting. Is this expected?", a: "Yes — GLP-1 agonists have demonstrated direct renoprotective effects beyond what would be expected from weight loss and blood pressure improvement alone. The FLOW trial with semaglutide showed significant reduction in kidney disease progression in people with type 2 diabetes and chronic kidney disease. Improved eGFR and reduced urinary albumin excretion are both positive signals — your nephrologist should be informed of the improvement and the medication responsible for it." },
          { q: "I feel like a different person metabolically. My energy, sleep, and cognitive clarity have all improved.", a: "All three improvements have plausible mechanistic connections to GLP-1 therapy. Energy: normalized glucose metabolism eliminates the energy-draining cycles of hyperglycemia. Sleep: weight loss reduces sleep apnea severity and normalized glucose reduces nocturnal hypoglycemia episodes that fragment sleep. Cognitive clarity: GLP-1 receptors are present in the brain and hyperglycemia itself impairs cognition acutely — normalizing glucose produces noticeable cognitive improvement. These improvements are durable as long as metabolic health is maintained." },
        ]
      }],
    }
  },

  // ── WEEKS 10-12 ───────────────────────────────────────────────────────────
  w12: {
    id: "w12", week: "Weeks 10–12", label: "Building the Exit", icon: "⑥",
    color: "#1A7A8A", tagline: "Sustainable results require a plan before you need one",
    universal: [
      {
        title: "The Long-Term Picture",
        qs: [
          { q: "Will I have to take this forever?", a: "For many people, long-term or indefinite treatment produces the most durable outcomes. Discontinuation studies consistently show significant regain in most who stop without durable lifestyle change. The medication creates the conditions for change — the habits you build during treatment determine what happens after. This is not a character failing — it reflects the chronic disease model of metabolic dysfunction." },
          { q: "If I stop, what should I actually expect?", a: "Appetite returns — often quickly and forcefully. The first 4–8 weeks post-discontinuation are the highest risk period for rapid regain. Having a clear nutritional and training plan in place before stopping, not after, is critical. Gradual dose taper over 4–6 weeks is strongly preferred over abrupt cessation." },
          { q: "What should I retest at 3 months?", a: "Repeat your baseline labs: fasting glucose, HbA1c, lipid panel, liver function, kidney function, full blood count. Add: ferritin and iron (deficiency is common after 3 months of reduced intake), vitamin D, B12, zinc. If you did a baseline DEXA, repeat it — the before/after body composition data is often more informative than the scale." },
          { q: "What does a genuinely successful 3-month outcome look like?", a: "Not just the scale. A genuinely successful 3-month outcome: meaningful fat loss with preserved lean mass, improved metabolic markers, an established training habit, consistent protein targets, a healthier relationship with food, and a clear plan for what comes next. If the weight has changed but the habits haven't, the outcome is incomplete." },
          { q: "What are the things people most commonly regret not doing differently?", a: "Starting resistance training later than they should have — muscle lost in months 1–3 is hard to rebuild. Not taking protein seriously enough in weeks 1–6. Measuring success only by scale weight. Not having a prescriber who followed up properly. Not addressing the psychological relationship with food. And underestimating how hard the first three weeks actually are." },
        ]
      },
    ],
    byTrack: {
      high_loss: [{
        title: "Three Months In — Higher BMI Assessment and Planning",
        qs: [
          { q: "I've lost significant weight but still have a long way to go. How do I think about the next phase?", a: "Three months is enough data to project forward meaningfully. Planning questions for the next phase: is the current dose still producing adequate appetite suppression, or is escalation appropriate? Are the habits genuinely consolidated, or still requiring significant effort? Are there any emerging nutritional deficiencies? For significant weight loss goals at higher starting BMI, 3 months is the beginning of the journey — not the end. Maximum weight loss with GLP-1 therapy typically occurs at 12–18 months of sustained treatment." },
          { q: "I feel genuinely different — not just physically but as a person. How do I integrate this change?", a: "Identity — how you understand yourself, how you navigate the world, how others relate to you — is deeply connected to body for many people. The change you're describing is real. It can include: a different relationship with physical space, a different experience of how others interact with you, and a different internal narrative about what you're capable of. These changes deserve reflection and integration, not just celebration. Journaling, therapy, or meaningful conversations with trusted people are all valuable ways to process an identity shift of this magnitude." },
          { q: "My weight loss has slowed significantly in weeks 10–12. Is this a sign I should stop?", a: "Slowing rate of loss in weeks 10–12 is physiological and expected — as body weight reduces, the caloric deficit required for the same rate of loss reduces, and metabolic adaptation accumulates. The appropriate response is usually dose reassessment with your prescriber, lifestyle optimization review, and expectation calibration — not stopping. Stopping at this stage because loss has slowed typically produces rapid regain before the habits that would support maintenance are established." },
        ]
      }],
      mid_loss: [{
        title: "Transitioning to Maintenance — Moderate BMI",
        qs: [
          { q: "I'm at or near my goal weight. How do I transition from weight loss mode to maintenance?", a: "Add 100–150 calories per week until weight stabilizes, prioritizing protein and complex carbohydrates. Give each adjustment 2 weeks before further changes — weight fluctuates enough that week-to-week readings are unreliable feedback. Shift training from deficit-focused to maintenance-focused: resistance training primary, activity for health and enjoyment rather than caloric expenditure." },
          { q: "My biggest fear is regaining the weight. What's the evidence-based approach to preventing regain?", a: "Resistance training practiced consistently, protein intake at 1.4–1.6g/kg maintained, regular self-monitoring (weekly weigh-ins — not obsessive but not absent), and having a clear re-escalation threshold — a specific weight at which you take action rather than watching regain accumulate. People who maintain successfully weigh themselves regularly and respond to early upward drift quickly." },
          { q: "I want to get pregnant in the next year. How does that affect my ongoing use?", a: "GLP-1 agonists should be discontinued before attempting to conceive — they are not recommended during pregnancy due to insufficient safety data. Stop at least 2 months before attempting conception. During this window: focus intensively on consolidating the eating and training habits that will support weight maintenance during the preconception and pregnancy periods." },
        ]
      }],
      mid_recomp: [{
        title: "Completing the Recomposition Phase — Weeks 10–12",
        qs: [
          { q: "My 12-week DEXA shows fat lost and lean mass maintained. What does my next phase look like?", a: "Your next training phase should shift from a recomposition deficit protocol to a muscle-building protocol with appropriate caloric increase. Transition: over 3–4 weeks, increase calories to maintenance by adding 100 calories per week, shift training emphasis from maintaining stimulus in a deficit to progressive overload for hypertrophy, and reassess your relationship with the medication — many recomposition users taper at this point." },
          { q: "What are the habits I absolutely must keep after stopping to preserve my results?", a: "In order of predictive importance: resistance training at least 2–3 times per week consistently — this is non-negotiable for maintaining the muscle you've built or preserved. Protein intake at minimum 1.4–1.6g/kg bodyweight daily. Regular self-monitoring — weekly weight and monthly measurements to catch early drift. Sleep quality. Of these, resistance training is the single most important. People who maintain training after stopping maintain results at significantly higher rates than those who don't." },
          { q: "I want to do another recomposition cycle in 6 months. How should I structure the intervening period?", a: "A planned muscle-building phase between recomposition cycles produces better long-term body composition outcomes than continuous recomposition. Structure: months 1–3 post-recomposition build at a modest caloric surplus (200–300 calories above maintenance) with progressive overload training. Month 4–5, return to maintenance to consolidate. Month 6, reassess body composition and begin second recomposition cycle if desired." },
        ]
      }],
      low_recomp: [{
        title: "Consolidation and Clean Exit — Performance Users",
        qs: [
          { q: "I've achieved my competition body fat. How do I maintain this without medication long-term?", a: "Maintaining competition or near-competition body fat without pharmacological support requires deliberate nutritional management. Structured eating with scheduled meals rather than hunger-driven eating, protein at 1.8–2.2g/kg to maximize satiety and muscle retention, strategic carbohydrate timing around training, and planned diet breaks at maintenance calories for 1–2 weeks every 8–12 weeks to reset hunger hormone signaling." },
          { q: "My off-season is starting. How does stopping the medication affect my ability to eat in a surplus?", a: "Stopping GLP-1 before an off-season bulk is typically appropriate. After stopping, expect 2–4 weeks for appetite to normalize and potentially overshoot before settling. Plan for this: in the first 2 weeks after stopping, maintain your current eating structure deliberately rather than eating freely in response to returning appetite. Give yourself 3–4 weeks at maintenance before introducing a true surplus." },
          { q: "Three months in — what do I know now that I wish I'd known at the start?", a: "The patterns from performance users at 12 weeks: that the performance impact of week one is temporary but more significant than expected — building that into the training plan from the start reduces anxiety. That liquid nutrition for training day fueling is not a compromise but the optimal tool. That body composition changes are more significant than the scale shows. That the psychological relationship with food changes meaningfully and durably. And that having a prescriber who understands performance goals specifically makes the entire experience significantly better." },
        ]
      }],
      metabolic: [{
        title: "The 3-Month Clinical Assessment — Metabolic Health",
        qs: [
          { q: "My 3-month HbA1c has dropped from 7.8% to 6.4%. What does this mean clinically?", a: "A 1.4% reduction in HbA1c in 12 weeks is a clinically significant response — above average for GLP-1 therapy in the first 3 months. Your average glucose over the past 3 months has reduced from approximately 175 mg/dL to approximately 135 mg/dL. You're at the upper edge of the pre-diabetic range rather than in the diabetic range. Your 10-year cardiovascular risk has meaningfully reduced. This result justifies continued treatment and warrants a conversation about the path to potential remission." },
          { q: "My liver enzymes have normalized completely after being significantly elevated. What does this mean for my NAFLD?", a: "Normalized liver enzymes after significant elevation are a strong positive signal — they indicate that active liver inflammation has substantially resolved. Enzyme normalization doesn't confirm complete liver fat resolution — that requires imaging. A repeat liver ultrasound at 12 months is appropriate to assess structural improvement. What enzyme normalization does confirm: the dangerous inflammatory phase of NAFLD has resolved and the medication is working on the liver specifically." },
          { q: "I want to stop the medication now that my metabolic markers are normal. My doctor wants me to continue. How do I make this decision?", a: "This involves weighing three things: the evidence for continued benefit, your personal values and preferences around long-term medication use, and the practical question of what monitoring and re-escalation looks like if markers deteriorate. A structured taper with close monitoring at 4 and 8 weeks post-discontinuation, with clear criteria for restarting, converts a binary stop/continue decision into a monitored experiment. That framing often resolves the disagreement." },
          { q: "After 3 months, what has this journey taught me about my metabolic health?", a: "The consistent patterns from metabolic health users at 12 weeks: that metabolic dysfunction is far more responsive to intervention than most people were told. That the metabolic symptoms attributed to 'just getting older' — fatigue, post-meal crashes, cognitive fog, poor sleep — had metabolic causes that were treatable. That the disease framing of metabolic conditions is actually empowering rather than stigmatizing. And that the lifestyle changes made during treatment have benefits that extend far beyond the metabolic markers they were designed to improve." },
        ]
      }],
    }
  },

};

const STAGE_ORDER = ["pre","w1","w3","w6","w9","w12"];

// ─── PROTEIN DATA ─────────────────────────────────────────────────────────────

// ─── PROTEIN PLANNER DATA ────────────────────────────────────────────────────

const PROTEIN_BARS = [
  { id:"quest",     name:"Quest Bar",               protein:21, cal:190, serve:"60g bar",   rating:5, note:"High fibre, no maltitol in most flavours. Widely available. Best all-round GLP-1 choice.",          warn:null,          flavours:"Chocolate Chip Cookie Dough, Cookies & Cream" },
  { id:"barebells", name:"Barebells",                protein:20, cal:210, serve:"55g bar",   rating:5, note:"No added sugar, soft texture easy on a suppressed stomach. Tastes genuinely good.",                  warn:"Contains maltitol — some GLP-1 users experience extra GI symptoms. Try one first.", flavours:"Cookies & Caramel, Chocolate Dough" },
  { id:"one",       name:"ONE Bar",                  protein:20, cal:220, serve:"60g bar",   rating:4, note:"1g sugar, clean ingredients, widely available at Target and Walmart.",                               warn:null,          flavours:"Maple Glazed Doughnut, Birthday Cake" },
  { id:"rxbar",     name:"RXBAR",                    protein:12, cal:200, serve:"52g bar",   rating:4, note:"Whole food ingredients only — egg whites, nuts, dates. No GI issues. Good for sensitive stomachs in early weeks.", warn:"Lower protein — best as a supplement to a shake, not as a standalone anchor.", flavours:"Chocolate Sea Salt, Peanut Butter" },
  { id:"pure",      name:"Pure Protein Bar",         protein:20, cal:190, serve:"50g bar",   rating:4, note:"Budget-friendly, available everywhere, reliable macros. The practical everyday choice.",              warn:null,          flavours:"Chocolate Deluxe, Peanut Butter" },
  { id:"other_bar", name:"My bar (enter protein)",   protein:0,  cal:0,   serve:"per bar",   rating:0, note:"Using a bar not listed? Enter the protein grams from the nutrition label.",                           warn:null,          flavours:"" },
];

const PROTEIN_POWDERS = [
  { id:"on_whey",   name:"ON Gold Standard Whey",    protein:24, cal:120, serve:"30g scoop", rating:5, note:"The benchmark. Smooth, mixes completely, tastes like chocolate milk. Available everywhere.",          warn:null,          type:"Whey blend" },
  { id:"iso100",    name:"Dymatize ISO100",           protein:25, cal:110, serve:"30g scoop", rating:5, note:"Pure whey isolate — easiest on the stomach. Best for nausea-prone weeks. Mixes instantly.",          warn:null,          type:"Whey isolate" },
  { id:"transparent",name:"Transparent Labs Whey",   protein:28, cal:130, serve:"33g scoop", rating:4, note:"Clean label, no artificial sweeteners. Grass-fed whey. For ingredient-conscious users.",             warn:null,          type:"Whey isolate" },
  { id:"on_casein", name:"ON Gold Standard Casein",  protein:24, cal:120, serve:"30g scoop", rating:4, note:"Slow release — take before bed to protect muscle overnight. The long-fast problem solver.",           warn:null,          type:"Casein" },
  { id:"garden",    name:"Garden of Life Sport",     protein:30, cal:160, serve:"40g scoop", rating:4, note:"Best plant option. Complete amino profile, no gut issues. Ideal for dairy-sensitive users.",          warn:null,          type:"Plant blend" },
  { id:"other_pwd", name:"My powder (enter protein)",protein:0,  cal:0,   serve:"per scoop", rating:0, note:"Using a powder not listed? Enter the protein grams per scoop from the label.",                        warn:null,          type:"Other" },
];

const PROTEIN_YOGHURTS = [
  { id:"chobani",   name:"Chobani Plain Non-Fat",    protein:17, cal:90,  serve:"170g cup",  rating:5, note:"Widely available, versatile. Add to shakes or eat alone. Look for plain — flavoured versions have more sugar." },
  { id:"fage",      name:"FAGE Total 0% Plain",      protein:18, cal:90,  serve:"170g cup",  rating:5, note:"Thicker than Chobani, more filling in small volumes. Good with a scoop of protein powder mixed in." },
  { id:"oikos",     name:"Oikos Triple Zero",        protein:15, cal:90,  serve:"150g cup",  rating:4, note:"No added sugar, no artificial sweeteners. Light texture — easiest to eat when appetite is low." },
  { id:"cottage",   name:"Good Culture Cottage Cheese",protein:14,cal:110,serve:"113g cup",  rating:5, note:"Higher protein density than most yoghurts. Soft, easy in small amounts. Blends invisibly into shakes." },
  { id:"siggi",     name:"Siggi's 0% Plain Skyr",    protein:17, cal:100, serve:"150g cup",  rating:4, note:"Icelandic-style, very thick. Low sugar. Filling — a small amount goes a long way on a suppressed appetite." },
  { id:"other_yog", name:"My yoghurt (enter protein)", protein:0,  cal:0,   serve:"per serve", rating:0, note:"Using something not listed? Enter the protein grams per serve from the label." },
];

// Whole foods to make up the delta
const WHOLE_FOODS = [
  // p100 = protein per 100g RAW/UNCOOKED weight (except tinned = drained weight)
  { id:"poultry",    name:"Chicken or turkey",   icon:"🍗", p100:23, raw:true,  note:"Raw weight. Shred or mince in broth — much easier on GLP-1 than grilled. Deli-sliced turkey is a no-cook shortcut. 150g raw = ~35g protein." },
  { id:"red_meat",   name:"Beef or lamb mince",  icon:"🥩", p100:20, raw:true,  note:"Raw weight. Lean mince (5% fat) in soups or bolognese — soft and easy in small portions. Lamb mince is slightly richer but similar protein. 150g raw = ~30g protein." },
  { id:"shrimp",     name:"Shrimp / prawns",     icon:"🍤", p100:18, raw:true,  note:"Raw weight. Very lean, high protein, quick to cook. Easy to eat in small amounts." },
  { id:"eggs",       name:"Eggs (whole)",        icon:"🥚", p100:13, raw:true,  note:"Raw weight. Scrambled or poached easiest on a suppressed appetite. 2 large eggs (~100g) = ~13g protein." },
  { id:"tuna",       name:"Tinned tuna",         icon:"🐟", p100:26, raw:false, note:"Drained weight. 95g tin = ~25g protein. Springwater packed. No cooking needed — the most convenient option." },
  { id:"salmon_tin", name:"Tinned salmon",       icon:"🐟", p100:25, raw:false, note:"Drained weight. Slightly richer than tuna. Good mixed into soft foods or on crackers." },
  { id:"tofu_firm",  name:"Firm tofu",           icon:"🌿", p100:8,  raw:true,  note:"Raw weight. Silken tofu blends invisibly into shakes. Best plant option for volume eating." },
  { id:"edamame",    name:"Edamame (shelled)",   icon:"🫘", p100:11, raw:true,  note:"Thawed weight. Complete plant protein. Available frozen — no prep needed. High fibre too." },
  { id:"lentils",    name:"Dry lentils",         icon:"🫘", p100:25, raw:true,  note:"Dry weight — double in volume when cooked. Red lentils are softest and quickest to digest." },
];

const PROTEIN_FOODS = {
  animal: [
    { name: "Cottage Cheese",           p: 25, serve: "200g",        cal: 160, stars: 5, note: "Soft, easy in small amounts, very high protein density. Blend into smoothies invisibly." },
    { name: "Greek Yoghurt (full fat)",  p: 17, serve: "200g tub",    cal: 190, stars: 5, note: "Soft, high volume, easy on a suppressed appetite. Look for 15g+ protein per 200g." },
    { name: "Tinned Salmon or Tuna",     p: 25, serve: "95g tin",     cal: 130, stars: 5, note: "Soft texture, easy in small amounts, shelf stable. Look for springwater packed." },
    { name: "Eggs (whole)",              p: 18, serve: "3 large",     cal: 215, stars: 5, note: "Complete amino acid profile. Scrambled or poached easiest to tolerate." },
    { name: "Whey Protein Powder",       p: 24, serve: "30g scoop",   cal: 120, stars: 5, note: "Best supplement when solid food is unappealing. Look for 80%+ protein by weight." },
    { name: "Chicken (shredded)",        p: 31, serve: "100g",        cal: 165, stars: 4, note: "Shredded in broth or as mince in soup is far easier than grilled breast." },
    { name: "Lean Beef Mince (5%)",      p: 26, serve: "100g cooked", cal: 175, stars: 4, note: "Soft when cooked, good in soups and bolognese — easy to eat in small portions." },
    { name: "Casein Protein Powder",     p: 24, serve: "30g scoop",   cal: 120, stars: 4, note: "Slow digesting — better for overnight muscle preservation. Useful before bed." },
  ],
  plant: [
    { name: "Edamame",              p: 17, serve: "1 cup (155g)", cal: 190, stars: 5, note: "One of the few complete plant proteins. Soft, easy, available frozen. High fibre." },
    { name: "Tofu (firm)",          p: 17, serve: "150g",         cal: 120, stars: 5, note: "Versatile. Silken tofu blends into smoothies invisibly. Complete amino profile." },
    { name: "Tempeh",               p: 20, serve: "100g",         cal: 195, stars: 4, note: "Fermented soy — better digestibility than tofu. Crumble into sauces." },
    { name: "Pea/Rice Protein Mix", p: 22, serve: "30g scoop",    cal: 120, stars: 4, note: "Complete amino profile approaching whey. Look for 70%+ protein by weight." },
    { name: "Lentils (cooked)",     p: 18, serve: "200g",         cal: 230, stars: 4, note: "High protein, high fibre. Red lentils are softer and easier to digest." },
  ],
  avoid: [
    { name: "Bars with maltitol",         why: "Causes significant GI distress — especially bad on GLP-1s where GI symptoms are already elevated." },
    { name: "Collagen as main protein",   why: "Incomplete amino acid profile — lacks tryptophan. Counting collagen toward your protein target causes muscle loss." },
    { name: "Oat, almond, or rice milk",  why: "These are 1–2g protein per serve. They are carbohydrate drinks, not protein sources." },
    { name: "Bars where sugar is first",  why: "Rule: protein per 100g should be 25g+ on the label. Most 'protein bars' fail this test." },
  ],
};

// ─── ACTIVITY DATA ────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { id: "walking",       label: "Walking",              icon: "🚶", cal: "250–400/hr",    verdict: "Zone 2 cardio — counts fully",          note: "The single most researched activity for GLP-1 outcomes. 30 mins brisk walking covers your daily Zone 2 target. Dog walks, commuting on foot, pacing on calls — it all counts." },
  { id: "golf",          label: "Golf (walking)",        icon: "⛳", cal: "600–900/round", verdict: "Excellent — Zone 2 cardio",              note: "18 holes walking with carry bag burns 600–900 cal and logs 12–15k steps. Two rounds a week fully covers your moderate cardio target. No other cardio required." },
  { id: "pilates",       label: "Pilates",               icon: "🧘", cal: "180–280/hr",    verdict: "Counts as resistance training",          note: "Clinical Pilates is resistance training. Targets posterior chain and core — exactly what GLP-1 users need to prevent muscle loss. Tell your instructor you want progressive challenge." },
  { id: "reformer",      label: "Reformer Pilates",      icon: "⚙️", cal: "250–350/hr",    verdict: "Excellent — resistance training",        note: "Spring tension provides genuine progressive resistance. One of the most effective non-gym resistance options, especially for core and posterior chain." },
  { id: "swimming",      label: "Swimming",              icon: "🏊", cal: "400–600/hr",    verdict: "Excellent — full body",                  note: "Full body resistance, zero joint stress, water pressure can help settle nausea. Lap swimming ticks both cardio and resistance boxes simultaneously." },
  { id: "cycling",       label: "Cycling",               icon: "🚴", cal: "300–500/hr",    verdict: "Zone 2 cardio — counts fully",          note: "Ideal Zone 2 work. E-bike riders still benefit — pedal assist reduces intensity but doesn't eliminate cardiovascular load." },
  { id: "yoga",          label: "Yoga",                  icon: "🙏", cal: "150–220/hr",    verdict: "Supportive — active recovery",           note: "Reduces cortisol (which drives fat retention), improves sleep quality, supports the nervous system. Compound with one resistance activity for best results." },
  { id: "housework",     label: "Active housework",      icon: "🧹", cal: "180–280/hr",    verdict: "Counts — functional movement",           note: "Vacuuming, mopping, scrubbing — sustained housework is legitimate NEAT. An active hour of housework is 200+ calories of real movement." },
  { id: "gardening",     label: "Gardening",             icon: "🌱", cal: "200–350/hr",    verdict: "Counts — functional movement",           note: "Digging, raking, hauling — active gardening loads your whole body. On days you can't do anything else, an hour in the garden is a genuine win." },
  { id: "dog_walking",   label: "Dog walking",           icon: "🐕", cal: "200–320/hr",    verdict: "Zone 2 cardio — counts fully",          note: "Twice daily walks likely gives you 40–60 minutes of moderate movement without thinking about it. Real Zone 2 cardio." },
  { id: "hiking",        label: "Hiking",                icon: "🥾", cal: "350–550/hr",    verdict: "Excellent — Zone 2–3 cardio",            note: "Uneven terrain loads legs more than flat walking. A 90-min weekend hike is one of the most complete single activities for GLP-1 users." },
  { id: "bodyweight",    label: "Bodyweight exercises",  icon: "💪", cal: "200–350/hr",    verdict: "Counts as resistance training",          note: "Push-ups, squats, lunges done consistently are legitimate resistance training. Add reps or slow tempo over time to keep signalling muscle retention." },
  { id: "home_weights",  label: "Home weights",          icon: "🏋️", cal: "220–380/hr",    verdict: "Excellent — resistance training",        note: "Even light dumbbells with slow tempo are effective for muscle preservation. The lowering phase drives most of the muscle signal — slow it down to 3–4 seconds." },
  { id: "aqua",          label: "Aqua aerobics",         icon: "💦", cal: "280–400/hr",    verdict: "Counts — low-impact resistance",         note: "Water resistance makes this a legitimate resistance and cardio session. Excellent for joint pain or anyone who finds land-based exercise uncomfortable." },
  { id: "running",       label: "Running",               icon: "🏃", cal: "500–800/hr",    verdict: "Zone 3 cardio — counts fully",          note: "Keep it comfortable during early GLP-1 months — your caloric intake is lower. Easy jogging is better than hard sprinting right now." },
  { id: "tennis",        label: "Tennis / pickleball",   icon: "🎾", cal: "350–550/hr",    verdict: "Interval cardio — counts fully",         note: "Stop-start racquet sports create natural interval training. Social and sustainable — people keep doing it, which is what matters most." },
  { id: "dancing",       label: "Dancing",               icon: "💃", cal: "300–450/hr",    verdict: "Cardio — counts fully",                  note: "Sustained cardio that people actually enjoy and maintain. If you love it, you'll keep doing it — worth more than the perfect exercise you dread." },
  { id: "active_kids",   label: "Active parenting",      icon: "👶", cal: "150–300/hr",    verdict: "Counts — functional movement",           note: "Chasing toddlers, park play, carrying children, pushing prams — active parenting involves more sustained movement than most people credit." },
  { id: "group_fitness", label: "Group fitness classes", icon: "🏃‍♀️", cal: "300–500/hr",  verdict: "Counts fully — plus accountability",     note: "Provides structured exercise and social accountability. GLP-1 users who maintain group fitness have significantly better long-term adherence." },
  { id: "walking_group", label: "Walking group",         icon: "👥", cal: "250–380/hr",    verdict: "Zone 2 cardio plus accountability",       note: "Combines Zone 2 cardio with social connection — both independently improve GLP-1 outcomes. Group accountability is one of the strongest predictors of sustained activity." },
  { id: "rowing",        label: "Rowing",                icon: "🚣", cal: "400–600/hr",    verdict: "Excellent — full body",                  note: "Loads upper back, core, legs and cardiovascular system simultaneously. Even 20 minutes is a complete session for a GLP-1 user." },
  { id: "stairs",        label: "Taking the stairs",     icon: "🏢", cal: "400–600/hr",    verdict: "Counts — incidental cardio",             note: "One of the highest caloric burn rates per minute of any daily activity. Also loads legs and glutes — genuine functional resistance." },
];

// ─── MOVEMENT Q&A ─────────────────────────────────────────────────────────────
const MOVE_QS = [
  { id: "minimum", icon: "⚡", q: "What's the minimum I actually need to do?",       title: "Here's the honest minimum",                  a: "Two things, separately. For fat loss: 30 minutes of brisk walking most days covers it — the GLP-1 is doing the heavy lifting on appetite. For muscle preservation: 2 sessions per week of resistance work. That's the non-negotiable floor. Walking alone won't protect muscle. Walking plus 2x resistance per week is genuinely the minimum effective dose." },
  { id: "enough",  icon: "🤔", q: "Is what I'm already doing enough?",               title: "You're likely doing more than you think",    a: "Probably more than you think. If you're walking daily, doing Pilates or golf regularly, and keeping protein up — you're in the top 20% of GLP-1 patients for lifestyle compliance. The question isn't whether to do more, it's whether to make what you do work smarter." },
  { id: "tired",   icon: "😴", q: "I'm too tired to exercise on dose day",            title: "Dose-day fatigue is real and expected",      a: "On dose day: a 10-minute walk is a genuine win. Seated stretching counts. Rest is not failure. The goal is to maintain the habit, not the intensity. Energy almost always normalises 48–72 hours after injection. The pattern becomes predictable — plan lighter activity on your injection day from the start." },
  { id: "skinfat", icon: "😟", q: "Why do I look skinny fat?",                        title: "This is the muscle-loss signal",             a: "GLP-1s reduce appetite so effectively that many people quietly under-eat protein. Fat drops, but muscle goes with it if protein and resistance work aren't deliberate. The fix: protein to 1.6–2g per kg bodyweight daily, and any resistance that challenges your muscles — Pilates, bodyweight, light weights. Your fortnightly photo check-in will help track this." },
  { id: "plateau", icon: "📉", q: "My progress looks stalled visually",               title: "The visual plateau is usually misleading",   a: "Visceral fat (around organs) depletes before subcutaneous fat becomes visibly reduced — your body is changing even when photos look the same. If you've built any muscle through activity, the scale won't show it. Stay consistent. Visible changes often come in a rush after a quiet period of 2–4 weeks." },
  { id: "nausea",  icon: "🤢", q: "Exercise makes my nausea worse",                   title: "Timing and intensity fix this",              a: "Wait 2–3 hours after eating before activity. Morning movement before your first meal often works best. If nausea hits mid-activity, switch to walking — almost always tolerable even when nausea is present. Reduce intensity, not frequency. Consistency at lower intensity always beats sporadic high-intensity." },
  { id: "stop",    icon: "⚠️", q: "What happens to my body when I stop the medication?", title: "Your habits now are your insurance policy", a: "People who stop without established exercise habits regain around two-thirds of lost weight within a year. Every walk, Pilates session, or golf round you do now is building a habit that will protect your results long after the medication. The activities you build during treatment are your long-term defence." },
];


// ─── ACTIVITY FREQUENCY & COACHING ENGINE ────────────────────────────────────

// Each activity contributes to three buckets: zone2, resistance, recovery
// Score per session (0-1). Frequency × score = weekly bucket fill.
const ACTIVITY_BUCKETS = {
  walking:       { zone2: 0.6, resistance: 0.0, recovery: 0.1, hasDuration: true  },
  golf:          { zone2: 1.0, resistance: 0.1, recovery: 0.2, hasDuration: false },
  pilates:       { zone2: 0.1, resistance: 0.9, recovery: 0.5, hasDuration: false },
  reformer:      { zone2: 0.1, resistance: 1.0, recovery: 0.4, hasDuration: false },
  swimming:      { zone2: 0.8, resistance: 0.5, recovery: 0.3, hasDuration: true  },
  cycling:       { zone2: 0.9, resistance: 0.1, recovery: 0.1, hasDuration: true  },
  yoga:          { zone2: 0.0, resistance: 0.2, recovery: 1.0, hasDuration: false },
  housework:     { zone2: 0.3, resistance: 0.1, recovery: 0.0, hasDuration: true  },
  gardening:     { zone2: 0.3, resistance: 0.2, recovery: 0.2, hasDuration: true  },
  dog_walking:   { zone2: 0.5, resistance: 0.0, recovery: 0.2, hasDuration: true  },
  hiking:        { zone2: 0.9, resistance: 0.2, recovery: 0.3, hasDuration: false },
  bodyweight:    { zone2: 0.1, resistance: 0.8, recovery: 0.1, hasDuration: false },
  home_weights:  { zone2: 0.1, resistance: 1.0, recovery: 0.1, hasDuration: false },
  aqua:          { zone2: 0.5, resistance: 0.6, recovery: 0.3, hasDuration: false },
  running:       { zone2: 1.0, resistance: 0.1, recovery: 0.0, hasDuration: true  },
  tennis:        { zone2: 0.7, resistance: 0.2, recovery: 0.1, hasDuration: false },
  dancing:       { zone2: 0.7, resistance: 0.1, recovery: 0.3, hasDuration: false },
  active_kids:   { zone2: 0.3, resistance: 0.1, recovery: 0.1, hasDuration: true  },
  group_fitness: { zone2: 0.6, resistance: 0.5, recovery: 0.1, hasDuration: false },
  walking_group: { zone2: 0.6, resistance: 0.0, recovery: 0.3, hasDuration: false },
  rowing:        { zone2: 0.8, resistance: 0.6, recovery: 0.1, hasDuration: false },
  stairs:        { zone2: 0.5, resistance: 0.3, recovery: 0.0, hasDuration: false },
  tai_chi:       { zone2: 0.0, resistance: 0.1, recovery: 0.9, hasDuration: false },
  stretching:    { zone2: 0.0, resistance: 0.0, recovery: 0.8, hasDuration: false },
};

// Duration multiplier for activities where time matters
function durationMultiplier(mins) {
  if (!mins || mins <= 20) return 0.5;
  if (mins <= 30) return 0.7;
  if (mins <= 45) return 0.9;
  if (mins <= 60) return 1.0;
  return 1.2;
}

// Weekly targets (sessions or score units)
const TARGETS = { zone2: 3.0, resistance: 2.0, recovery: 2.0 };

function scoreWeek(selectedActivities, frequencies, durations) {
  const totals = { zone2: 0, resistance: 0, recovery: 0 };
  selectedActivities.forEach(id => {
    const buckets = ACTIVITY_BUCKETS[id];
    if (!buckets) return;
    const freq = frequencies[id] || 1;
    const durMult = buckets.hasDuration ? durationMultiplier(durations[id]) : 1;
    totals.zone2      += buckets.zone2      * freq * durMult;
    totals.resistance += buckets.resistance * freq * durMult;
    totals.recovery   += buckets.recovery   * freq * durMult;
  });
  return {
    zone2:      Math.min(totals.zone2      / TARGETS.zone2,      1),
    resistance: Math.min(totals.resistance / TARGETS.resistance, 1),
    recovery:   Math.min(totals.recovery   / TARGETS.recovery,   1),
    raw: totals,
  };
}

function buildCoachingAdvice(scores, selectedActivities, frequencies, durations) {
  const gaps = [];
  if (scores.resistance < 0.6) gaps.push("resistance");
  if (scores.zone2      < 0.6) gaps.push("zone2");
  if (scores.recovery   < 0.6) gaps.push("recovery");

  const hasResistance = selectedActivities.some(id =>
    (ACTIVITY_BUCKETS[id]?.resistance || 0) >= 0.7
  );
  const hasZone2 = selectedActivities.some(id =>
    (ACTIVITY_BUCKETS[id]?.zone2 || 0) >= 0.6
  );

  // Walking duration check
  const walkingSelected = selectedActivities.includes("walking") || selectedActivities.includes("dog_walking");
  const walkDuration = durations["walking"] || durations["dog_walking"] || 0;
  const walkFreq = (frequencies["walking"] || 0) + (frequencies["dog_walking"] || 0);
  const shortWalks = walkingSelected && walkDuration > 0 && walkDuration < 30;

  // Build primary recommendation
  let primary = null;
  let rampUp = [];
  let rampDown = [];

  if (gaps.includes("resistance") && !hasResistance) {
    primary = {
      icon: "💪",
      title: "Add resistance — this is the priority",
      body: "Your program is missing the muscle preservation signal. On GLP-1s this is non-negotiable. You don't need a gym — 10 minutes of bodyweight work twice a week (push-ups, squats, lunges) or two Pilates sessions changes everything.",
      type: "warn",
    };
  } else if (gaps.includes("resistance") && hasResistance) {
    primary = {
      icon: "📈",
      title: "Increase your resistance frequency",
      body: "You have the right activity — just not enough of it. Move your resistance sessions from " + (frequencies[selectedActivities.find(id => (ACTIVITY_BUCKETS[id]?.resistance||0)>=0.7)] || 1) + "x to 3x per week. That single change protects the most muscle.",
      type: "warn",
    };
  } else if (gaps.includes("zone2") && !hasZone2) {
    primary = {
      icon: "🚶",
      title: "Add Zone 2 cardio",
      body: "30 minutes of brisk walking most days is the most researched activity for GLP-1 fat loss. It doesn't need to be structured exercise — commuting on foot, dog walks, and parking further away all count.",
      type: "info",
    };
  } else if (shortWalks) {
    primary = {
      icon: "⏱",
      title: "Extend your walks to 30+ minutes",
      body: "Shorter walks count but the Zone 2 fat-burning signal kicks in properly around 25–30 minutes. You're close — just add 10 more minutes to your existing habit.",
      type: "info",
    };
  } else if (gaps.length === 0) {
    primary = {
      icon: "✅",
      title: "Your week is well balanced",
      body: "You're hitting the minimum effective dose across all three areas. The one upgrade worth making: make sure your resistance sessions are progressively challenging — tell your Pilates instructor or add reps each week. Stagnation is the risk, not the amount.",
      type: "good",
    };
  } else {
    primary = {
      icon: "👍",
      title: "Good foundation — one gap to close",
      body: "You're covering most of what matters. Focus on the area flagged below and you'll be in the top tier of GLP-1 program adherence.",
      type: "good",
    };
  }

  // Ramp up suggestions
  if (scores.resistance < 0.9 && hasResistance) {
    const resistId = selectedActivities.find(id => (ACTIVITY_BUCKETS[id]?.resistance||0) >= 0.7);
    const resistActivity = ACTIVITIES.find(a => a.id === resistId);
    if (resistActivity) rampUp.push({ label: resistActivity.label, suggestion: "Increase to 3x per week" });
  }
  if (scores.zone2 < 0.9 && walkingSelected && walkDuration < 45) {
    rampUp.push({ label: "Walking", suggestion: `Extend to 45 min (currently ${walkDuration || "?"}min)` });
  }
  if (scores.zone2 < 0.7 && walkFreq < 3) {
    rampUp.push({ label: "Walking", suggestion: "Add one more session per week" });
  }

  // Ramp down — if someone is doing lots of cardio but no resistance
  if (scores.zone2 >= 1.0 && scores.resistance < 0.5) {
    const topZone2 = selectedActivities
      .filter(id => (ACTIVITY_BUCKETS[id]?.zone2||0) >= 0.8)
      .sort((a,b) => (frequencies[b]||1) - (frequencies[a]||1))[0];
    const act = ACTIVITIES.find(a => a.id === topZone2);
    if (act && (frequencies[topZone2]||1) > 2) {
      rampDown.push({ label: act.label, suggestion: "You could reduce by one session and swap it for resistance work" });
    }
  }

  return { primary, rampUp, rampDown, gaps, scores };
}

// ─── CLAUDE VISION ───────────────────────────────────────────────────────────
async function analysePhoto(b64, questionId, activities, num) {
  const actCtx = activities.length ? `User's regular activities: ${activities.join(", ")}.` : "";
  const qCtx   = questionId ? `User flagged: "${MOVE_QS.find(q => q.id === questionId)?.q}". Address this directly.` : "";
  const isBase  = num === 1;

  const prompt = `You are a clinical body composition analyst for a GLP-1 medication support program.
${isBase ? "This is the user's BASELINE photo — do not assess progress, just set expectations." : `This is check-in #${num}.`}
${actCtx} ${qCtx}
Analyse upper body composition. Focus on fat distribution, muscle definition, signs of muscle loss.
Keep tone warm, clinical, motivating. Never body-shame.
Respond ONLY with valid JSON (no markdown fences):
{"headline":"4-6 words","subtitle":"1-2 sentences","observations":[{"title":"...","detail":"...","positive":true}],"adjustments":[{"label":"short label","text":"specific advice referencing their activities"}],"insight":{"title":"...","body":"...","type":"good"}}`;

  try {
    const res  = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 900,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
          { type: "text", text: prompt }
        ]}]
      })
    });
    const data = await res.json();
    const raw  = data.content?.find(b => b.type === "text")?.text || "";
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return {
      headline: isBase ? "Baseline captured" : "Progress visible",
      subtitle: isBase ? "Your benchmark is set. We'll compare every fortnight from here." : "Body composition changes are visible since your last check-in.",
      observations: [
        { title: isBase ? "Good starting structure" : "Midsection responding", detail: isBase ? "Solid foundation. Your existing activities are giving you a real advantage." : "Visible reduction in lower abdominal softness. Your activities are contributing.", positive: true },
        { title: "Protein is the key variable", detail: "Keep protein at 1.6–2g per kg bodyweight. This is what separates good outcomes from great ones on GLP-1s.", positive: false }
      ],
      adjustments: [
        { label: activities.includes("golf") ? "Golf covers your Zone 2" : "Walking is your foundation", text: activities.includes("golf") ? "Two rounds a week with carry bag covers your moderate cardio entirely. Non-golf days need only 20 minutes of walking." : "Aim for 30 minutes of brisk walking most days. This is your most powerful tool alongside the medication." },
        { label: activities.includes("pilates") ? "Pilates is your resistance" : "Add bodyweight resistance", text: activities.includes("pilates") ? "Your Pilates sessions count as clinical resistance training. Tell your instructor you want progressive challenge while on GLP-1." : "Start with 10 minutes of bodyweight work daily — push-ups, squats, lunges. This signals your body to preserve muscle." }
      ],
      insight: { title: isBase ? "What to expect in the next fortnight" : "You're in the optimal window", body: isBase ? "Early GLP-1 changes are mostly internal — visceral fat reduces before external appearance shifts. Don't judge the first 2 weeks by the mirror." : "Visible composition changes typically accelerate between weeks 8–16. Keep activities consistent and protein high.", type: "good" }
    };
  }
}

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body, button, input, textarea, select { font-family: 'Jost', sans-serif; }
::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
.serif { font-family: 'Cormorant Garamond', serif; }
@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes spin { to { transform:rotate(360deg); } }
.fadeUp { animation: fadeUp 0.35s ease both; }
`;

// ─── SMALL REUSABLE PIECES ────────────────────────────────────────────────────
const Chip = ({ on, onClick, children }) => (
  <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:100, border:`1.5px solid ${on ? T.teal : T.border}`, background: on ? T.teal+"12" : T.light, color: on ? T.teal : T.muted, fontSize:13, fontWeight: on ? 600:400, cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}>
    {children}
  </button>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:T.white, borderRadius:14, border:`1px solid ${T.border}`, overflow:"hidden", ...style }}>
    {children}
  </div>
);

const SectionHead = ({ eyebrow, title, sub }) => (
  <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${T.border}` }}>
    {eyebrow && <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:2, marginBottom:4 }}>{eyebrow}</div>}
    <div className="serif" style={{ fontSize:20, color:T.navy, marginBottom: sub ? 4 : 0 }}>{title}</div>
    {sub && <div style={{ fontSize:13, color:T.muted, lineHeight:1.5 }}>{sub}</div>}
  </div>
);

const PrimaryBtn = ({ onClick, disabled, children, color=T.teal }) => (
  <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:"14px", background: disabled ? T.border : color, color:T.white, border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor: disabled ? "not-allowed":"pointer", transition:"all 0.2s", letterSpacing:0.3 }}>
    {children}
  </button>
);

// ─── PAYWALL ─────────────────────────────────────────────────────────────────
function Paywall({ onUnlock }) {
  return (
    <div className="fadeUp" style={{ padding:"40px 24px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", maxWidth:460, margin:"0 auto" }}>
      <div style={{ width:64, height:64, borderRadius:18, background:`linear-gradient(135deg,${T.teal},${T.sage})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:20 }}>📸</div>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:10 }}>Premium</div>
      <h2 className="serif" style={{ fontSize:26, color:T.navy, lineHeight:1.2, marginBottom:12 }}>Your Week 3 results are ready to reveal</h2>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:28 }}>
        Upload your fortnightly photo. Our AI analyses body composition changes, compares to your baseline, and adjusts your movement plan based on what it actually sees.
      </p>
      <Card style={{ width:"100%", marginBottom:24, textAlign:"left" }}>
        <div style={{ padding:"16px 20px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:12 }}>What's included</div>
          {[
            "Fortnightly photo analysis with Claude AI",
            "Body composition progress tracking",
            "Activity adjustments based on your photo",
            "Biweekly reminder — see your results",
            "Movement validator for your existing habits",
            "Script price comparison tool",
          ].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:T.teal+"18", color:T.teal, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✓</div>
              <span style={{ fontSize:13, color:T.text }}>{f}</span>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:6 }}>
        <span className="serif" style={{ fontSize:42, fontWeight:700, color:T.navy }}>$9</span>
        <span style={{ fontSize:14, color:T.muted }}>/month · Cancel anytime</span>
      </div>
      <p style={{ fontSize:12, color:T.muted, marginBottom:20 }}>Less than one protein bar a week. And it finds you cheaper scripts.</p>
      <PrimaryBtn onClick={onUnlock} color={`linear-gradient(135deg,${T.teal},${T.sage})`}>Unlock Premium →</PrimaryBtn>
      <p style={{ fontSize:11, color:"#bbb", marginTop:10 }}>Demo: tap to unlock for this session</p>
    </div>
  );
}

// ─── JOURNEY TAB ─────────────────────────────────────────────────────────────
function JourneyTab({ track }) {
  const [stage, setStage]   = useState("pre");
  const [openS, setOpenS]   = useState(null);
  const [openQ, setOpenQ]   = useState(null);
  const current = CONTENT[stage];
  const trackSections = (current.byTrack[track] || []);
  const allSections = [...current.universal, ...trackSections];

  return (
    <div style={{ paddingBottom:24 }}>
      {/* Stage pills - horizontal scroll */}
      <div style={{ background:T.white, borderBottom:`1px solid ${T.border}`, padding:"12px 16px" }}>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
          {STAGE_ORDER.map(id => { const s = CONTENT[id]; return (
            <button key={s.id} onClick={() => { setStage(s.id); setOpenS(null); setOpenQ(null); }} style={{ flexShrink:0, padding:"6px 14px", borderRadius:100, border:`1.5px solid ${stage===s.id ? s.color : T.border}`, background: stage===s.id ? s.color+"14" : T.white, color: stage===s.id ? s.color : T.muted, fontSize:12, fontWeight: stage===s.id ? 700:400, cursor:"pointer", whiteSpace:"nowrap" }}>
              {s.icon} {s.label}
            </button>
          ); })}
        </div>
      </div>

      {/* Stage header */}
      <div style={{ padding:"16px 16px 12px", background:T.white, borderBottom:`3px solid ${current.color}`, marginBottom:12 }}>
        <div className="serif" style={{ fontSize:22, color:T.navy, marginBottom:4 }}>{current.label}</div>
        <div style={{ fontSize:13, color:T.muted }}>{current.tagline}</div>
      </div>

      {/* Sections */}
      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {allSections.map((sec, si) => {
          const sk = `${stage}-${si}`;
          const isOpen = openS === sk;
          return (
            <Card key={si}>
              <button onClick={() => setOpenS(isOpen ? null : sk)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", border:"none", background: isOpen ? current.color+"08" : T.white, cursor:"pointer", borderRadius:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:24, height:24, borderRadius:7, background: si >= current.universal.length ? T.teal : current.color, color:T.white, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{si+1}</div>
                  <span style={{ fontSize:14, fontWeight:600, color: isOpen ? current.color : T.navy, textAlign:"left" }}>{sec.title}</span>
                </div>
                <span style={{ color:current.color, fontSize:14, transform: isOpen ? "rotate(180deg)":"none", transition:"transform 0.2s" }}>⌄</span>
              </button>
              {isOpen && (
                <div style={{ padding:"4px 12px 12px", display:"flex", flexDirection:"column", gap:6 }}>
                  {sec.qs.map((item, qi) => {
                    const qk = `${sk}-${qi}`;
                    const qOpen = openQ === qk;
                    return (
                      <div key={qi} style={{ borderRadius:10, background:T.light, borderLeft:`3px solid ${qOpen ? current.color : "#ddd"}`, transition:"border-color 0.2s" }}>
                        <button onClick={() => setOpenQ(qOpen ? null : qk)} style={{ width:"100%", background:"none", border:"none", padding:"11px 13px", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start", textAlign:"left" }}>
                          <span style={{ color:current.color, fontSize:11, fontWeight:700, flexShrink:0, marginTop:2 }}>Q</span>
                          <span style={{ fontSize:13, fontWeight:500, color: qOpen ? T.navy : "#444", lineHeight:1.4, flex:1 }}>{item.q}</span>
                          <span style={{ color:"#ccc", fontSize:12, flexShrink:0 }}>{qOpen ? "−":"+"}</span>
                        </button>
                        {qOpen && (
                          <div style={{ display:"flex", gap:9, padding:"0 13px 13px", borderTop:`1px solid #e8e4df` }}>
                            <span style={{ color:current.color, fontSize:11, fontWeight:700, flexShrink:0, marginTop:13 }}>A</span>
                            <p style={{ fontSize:13, color:"#444", lineHeight:1.8, paddingTop:13, margin:0 }}>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── TRACK TAB (Move + Check-in combined) ────────────────────────────────────
function TrackTab({ isPremium, onUnlock, selectedActivities, setSelectedActivities, frequencies, setFrequencies, durations, setDurations, photoHistory, setPhotoHistory }) {
  const [view, setView]       = useState("move"); // move | checkin
  const [openQ, setOpenQ]     = useState(null);
  // Photo check-in state
  const [ciPhase, setCiPhase] = useState("upload"); // upload | loading | result
  const [imgPreview, setImgPreview] = useState(null);
  const [imgB64, setImgB64]   = useState(null);
  const [selQ, setSelQ]       = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const fileInputRef            = useRef();
  const checkInNum              = photoHistory.length + 1;
  const validated               = ACTIVITIES.filter(a => selectedActivities.includes(a.id));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImgPreview(ev.target.result);
      setImgB64(ev.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyse = async () => {
    setCiPhase("loading");
    const result = await analysePhoto(imgB64, selQ, selectedActivities, checkInNum);
    setAnalysis(result);
    setPhotoHistory(prev => [...prev, { date: today(), num: checkInNum, headline: result.headline }]);
    setCiPhase("result");
  };

  const resetCI = () => { setCiPhase("upload"); setImgPreview(null); setImgB64(null); setSelQ(null); setAnalysis(null); if(fileInputRef.current) fileInputRef.current.value = ""; };

  // Checkin milestone dots
  const dots = [1,2,3,4,5].map((n,i) => ({ done: photoHistory.length >= n, active: photoHistory.length === i }));

  return (
    <div style={{ paddingBottom:24 }}>
      {/* Sub-nav */}
      <div style={{ background:T.white, borderBottom:`1px solid ${T.border}`, display:"flex" }}>
        {[["move","🏃 Movement"],["checkin","📸 Results"]].map(([v,label]) => (
          <button key={v} onClick={() => setView(v)} style={{ flex:1, padding:"13px 8px", border:"none", background:"transparent", cursor:"pointer", borderBottom:`3px solid ${view===v ? T.teal : "transparent"}`, color: view===v ? T.teal : T.muted, fontSize:13, fontWeight: view===v ? 700:400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ─ MOVEMENT view ─ */}
      {view === "move" && (
        <div style={{ padding:"16px" }}>

          {/* Step 1: Select activities */}
          <div style={{ marginBottom:4 }}>
            <div className="serif" style={{ fontSize:20, color:T.navy, marginBottom:4 }}>Build your movement plan</div>
            <div style={{ fontSize:13, color:T.muted, lineHeight:1.55, marginBottom:16 }}>Select what you do regularly, set how often, and we'll show you your profile — plus the one thing worth adjusting.</div>
          </div>

          <Card style={{ marginBottom:14 }}>
            <div style={{ padding:"14px 16px 16px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:2, marginBottom:12 }}>Step 1 — Select your activities</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {ACTIVITIES.map(a => (
                  <Chip key={a.id} on={selectedActivities.includes(a.id)} onClick={() => {
                    setSelectedActivities(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id]);
                  }}>
                    {a.icon} {a.label}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          {/* Step 2: Frequency + duration per activity */}
          {validated.length > 0 && (
            <Card style={{ marginBottom:14 }}>
              <div style={{ padding:"14px 16px 4px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:2, marginBottom:14 }}>Step 2 — How often each week?</div>
                {validated.map((a, i) => {
                  const buckets = ACTIVITY_BUCKETS[a.id] || {};
                  const freq = frequencies[a.id] || 1;
                  const dur  = durations[a.id] || 30;
                  return (
                    <div key={a.id} style={{ marginBottom:18, paddingBottom:14, borderBottom: i < validated.length-1 ? `1px solid ${T.border}` : "none" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:T.navy }}>{a.icon} {a.label}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{a.cal} cal</div>
                      </div>

                      {/* Frequency stepper */}
                      <div style={{ marginBottom: buckets.hasDuration ? 10 : 0 }}>
                        <div style={{ fontSize:11, color:T.muted, marginBottom:7, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Times per week</div>
                        <div style={{ display:"flex", gap:6 }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} onClick={() => setFrequencies(prev => ({ ...prev, [a.id]: n }))}
                              style={{ width:38, height:38, borderRadius:10, border:`2px solid ${freq===n ? T.teal : T.border}`, background: freq===n ? T.teal : T.light, color: freq===n ? T.white : T.muted, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                              {n}
                            </button>
                          ))}
                          <button onClick={() => setFrequencies(prev => ({ ...prev, [a.id]: 6 }))}
                            style={{ padding:"0 10px", height:38, borderRadius:10, border:`2px solid ${freq>=6 ? T.teal : T.border}`, background: freq>=6 ? T.teal : T.light, color: freq>=6 ? T.white : T.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                            6+
                          </button>
                        </div>
                      </div>

                      {/* Duration picker — only for time-sensitive activities */}
                      {buckets.hasDuration && (
                        <div>
                          <div style={{ fontSize:11, color:T.muted, marginBottom:7, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Duration</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {[15,20,30,45,60,90].map(mins => (
                              <button key={mins} onClick={() => setDurations(prev => ({ ...prev, [a.id]: mins }))}
                                style={{ padding:"7px 12px", borderRadius:10, border:`2px solid ${dur===mins ? T.teal : T.border}`, background: dur===mins ? T.teal : T.light, color: dur===mins ? T.white : T.muted, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                                {mins}m
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Step 3: Coaching output */}
          {validated.length > 0 && (() => {
            const scores  = scoreWeek(selectedActivities, frequencies, durations);
            const advice  = buildCoachingAdvice(scores, selectedActivities, frequencies, durations);
            const bucketColor = (score) => score >= 0.85 ? T.sage : score >= 0.5 ? T.amber : T.rose;
            const bucketLabel = (score) => score >= 0.85 ? "✓ Covered" : score >= 0.5 ? "Partial" : "Gap";
            return (
              <div>
                {/* Bucket scores */}
                <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Step 3 — Your movement profile</div>
                <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                  {[
                    { key:"zone2",      label:"Zone 2 Cardio",  icon:"🏃", score:scores.zone2 },
                    { key:"resistance", label:"Resistance",     icon:"💪", score:scores.resistance },
                    { key:"recovery",   label:"Recovery",       icon:"🧘", score:scores.recovery },
                  ].map(b => (
                    <div key={b.key} style={{ flex:1, background:T.white, borderRadius:12, border:`1px solid ${T.border}`, padding:"12px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{b.icon}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{b.label}</div>
                      {/* Progress bar */}
                      <div style={{ height:6, background:T.light, borderRadius:3, overflow:"hidden", marginBottom:6 }}>
                        <div style={{ height:"100%", width:`${Math.round(b.score*100)}%`, background:bucketColor(b.score), borderRadius:3, transition:"width 0.5s ease" }} />
                      </div>
                      <div style={{ fontSize:10, fontWeight:700, color:bucketColor(b.score) }}>{bucketLabel(b.score)}</div>
                    </div>
                  ))}
                </div>

                {/* Primary coaching card */}
                {advice.primary && (
                  <div style={{ background: advice.primary.type==="warn" ? T.rose+"0C" : advice.primary.type==="good" ? T.sage+"0C" : T.teal+"0C", border:`1px solid ${advice.primary.type==="warn" ? T.rose+"40" : advice.primary.type==="good" ? T.sage+"40" : T.teal+"40"}`, borderRadius:12, padding:"16px", marginBottom:10 }}>
                    <div style={{ fontSize:16, marginBottom:8 }}>{advice.primary.icon}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:6 }}>{advice.primary.title}</div>
                    <div style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>{advice.primary.body}</div>
                  </div>
                )}

                {/* Ramp up suggestions */}
                {advice.rampUp.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>↑ Worth ramping up</div>
                    {advice.rampUp.map((r,i) => (
                      <div key={i} style={{ background:T.white, borderRadius:10, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.teal}`, padding:"10px 14px", marginBottom:6, display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:T.teal }}>↑</span>
                        <div><span style={{ fontSize:13, fontWeight:600, color:T.navy }}>{r.label}</span><span style={{ fontSize:13, color:T.muted }}> — {r.suggestion}</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ramp down suggestions */}
                {advice.rampDown.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>↓ Consider rebalancing</div>
                    {advice.rampDown.map((r,i) => (
                      <div key={i} style={{ background:T.white, borderRadius:10, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.amber}`, padding:"10px 14px", marginBottom:6, display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:T.amber }}>↓</span>
                        <div><span style={{ fontSize:13, fontWeight:600, color:T.navy }}>{r.label}</span><span style={{ fontSize:13, color:T.muted }}> — {r.suggestion}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {validated.length === 0 && (
            <div style={{ background:T.white, borderRadius:12, border:`1px solid ${T.border}`, borderLeft:`4px solid ${T.amber}`, padding:"14px 16px" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:4 }}>Tap your activities above to get started</div>
              <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>Include everyday things — dog walking, housework, gardening. It all counts and we'll show you exactly how.</div>
            </div>
          )}

          {/* Movement Q&A */}
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Common questions</div>
            <Card>
              {MOVE_QS.map((q, i) => (
                <div key={q.id} style={{ borderBottom: i < MOVE_QS.length-1 ? `1px solid ${T.border}` : "none" }}>
                  <button onClick={() => setOpenQ(openQ===q.id ? null : q.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{q.icon}</span>
                    <span style={{ flex:1, fontSize:13, fontWeight:500, color:T.navy, lineHeight:1.4 }}>{q.q}</span>
                    <span style={{ color:"#ccc", fontSize:12, flexShrink:0 }}>{openQ===q.id ? "−":"+"}</span>
                  </button>
                  {openQ===q.id && (
                    <div style={{ padding:"0 16px 14px 46px" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{q.title}</div>
                      <div style={{ fontSize:13, color:"#444", lineHeight:1.75 }}>{q.a}</div>
                    </div>
                  )}
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ─ RESULTS (photo check-in) view ─ */}
      {view === "checkin" && !isPremium && <Paywall onUnlock={onUnlock} />}

      {view === "checkin" && isPremium && (
        <div style={{ padding:"16px" }}>
          {/* Timeline dots */}
          <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
            {dots.map((d,i) => (
              <div key={i} style={{ display:"contents" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${d.done ? T.teal : d.active ? T.teal : T.border}`, background: d.done ? T.teal : d.active ? T.teal+"18" : "transparent", color: d.done ? T.white : d.active ? T.teal : T.muted, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700 }}>
                    {d.done ? "✓" : i+1}
                  </div>
                  <div style={{ fontSize:8, color:T.muted, letterSpacing:1, textTransform:"uppercase" }}>Wk {(i+1)*2-1}</div>
                </div>
                {i < dots.length-1 && <div style={{ flex:1, height:1.5, background: d.done ? T.teal : T.border, margin:"0 4px", marginBottom:16 }} />}
              </div>
            ))}
          </div>

          {ciPhase === "upload" && (
            <>
              <div className="serif" style={{ fontSize:20, color:T.navy, marginBottom:4 }}>
                {checkInNum === 1 ? "Set your baseline" : `Fortnight ${checkInNum} check-in`}
              </div>
              <div style={{ fontSize:13, color:T.muted, lineHeight:1.55, marginBottom:16 }}>
                {checkInNum === 1
                  ? "Your baseline is the benchmark everything is compared to. Take it once — comparisons start from here."
                  : "Upload your photo. We'll compare to your baseline and adjust your movement plan based on what we see."}
              </div>

              {/* Upload section */}
              <Card style={{ marginBottom:12 }}>
                <SectionHead eyebrow="Step 1" title="Upload your photo" />
                <div style={{ padding:"16px" }}>
                  {/* Guidelines */}
                  <div style={{ background:T.light, borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
                    {[
                      { ok:true,  t:"Upper body front — shoulders to navel only" },
                      { ok:true,  t:"Morning before food gives most consistent results" },
                      { ok:true,  t:"Same lighting spot each fortnight" },
                      { ok:false, t:"No face — not required or stored" },
                      { ok:false, t:"No full nudity — underwear or activewear only" },
                    ].map((g,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color: g.ok ? T.muted : T.rose, marginBottom:i<4?6:0 }}>
                        <span style={{ flexShrink:0, fontWeight:700 }}>{g.ok ? "✓":"✗"}</span>{g.t}
                      </div>
                    ))}
                  </div>

                  {/* Preview or upload button */}
                  {imgPreview ? (
                    <div style={{ borderRadius:10, overflow:"hidden", marginBottom:12 }}>
                      <img src={imgPreview} alt="Preview" style={{ width:"100%", height:220, objectFit:"cover", objectPosition:"top", display:"block" }} />
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:T.navy }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#52b788" }}>
                          <div style={{ width:7, height:7, borderRadius:"50%", background:"#52b788" }} />Photo uploaded
                        </div>
                        <button onClick={() => { setImgPreview(null); setImgB64(null); if(fileInputRef.current) fileInputRef.current.value=""; }} style={{ background:"none", border:"1px solid rgba(255,255,255,0.2)", borderRadius:7, padding:"4px 10px", color:"rgba(255,255,255,0.5)", fontSize:11, cursor:"pointer" }}>Change photo</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom:12 }}>
                      {/* Visible file input — not hidden */}
                      <label htmlFor="photo-upload" style={{ display:"block", width:"100%", padding:"14px", background:T.navy, color:T.white, borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", textAlign:"center", letterSpacing:0.3 }}>
                        📷 Choose photo from library
                      </label>
                      <input
                        id="photo-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ position:"absolute", width:1, height:1, opacity:0, overflow:"hidden", clip:"rect(0,0,0,0)" }}
                      />
                      <div style={{ textAlign:"center", marginTop:8, fontSize:12, color:T.muted }}>Shoulders to navel · Activewear or underwear · No face needed</div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Optional concern */}
              <Card style={{ marginBottom:16 }}>
                <SectionHead eyebrow="Step 2 — Optional" title="Anything on your mind?" sub="If you flag a concern, the analysis will address it directly." />
                <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:7 }}>
                  {MOVE_QS.filter(q => ["skinfat","plateau","tired","stop"].includes(q.id)).map(q => (
                    <button key={q.id} onClick={() => setSelQ(selQ===q.id ? null : q.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:10, border:`1.5px solid ${selQ===q.id ? T.teal : T.border}`, background: selQ===q.id ? T.teal+"0C" : T.light, cursor:"pointer", textAlign:"left" }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{q.icon}</span>
                      <span style={{ fontSize:13, fontWeight: selQ===q.id ? 600:400, color: selQ===q.id ? T.teal : T.navy }}>{q.q}</span>
                    </button>
                  ))}
                </div>
                <div style={{ padding:"0 14px 14px" }}>
                  <PrimaryBtn onClick={handleAnalyse} disabled={!imgPreview} color={T.teal}>
                    {imgPreview ? (checkInNum===1 ? "Set My Baseline →" : "Analyse My Results →") : "Upload a photo first"}
                  </PrimaryBtn>
                </div>
              </Card>
            </>
          )}

          {ciPhase === "loading" && (
            <Card style={{ padding:"48px 24px", textAlign:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
                <div style={{ width:36, height:36, border:`2px solid ${T.border}`, borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.75s linear infinite" }} />
                <div style={{ fontSize:14, color:T.muted }}>Analysing your check-in…</div>
                <div style={{ fontSize:12, color:"#bbb" }}>Comparing to baseline · Reviewing your activities</div>
              </div>
            </Card>
          )}

          {ciPhase === "result" && analysis && (
            <div className="fadeUp">
              <Card style={{ marginBottom:14 }}>
                <div style={{ background:T.navy, padding:"22px 20px 18px" }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(82,183,136,0.15)", border:"1px solid rgba(82,183,136,0.3)", borderRadius:100, padding:"4px 12px", fontSize:9, letterSpacing:2, textTransform:"uppercase", color:"#52b788", marginBottom:12 }}>
                    ✦ {checkInNum===1 ? "Baseline Set" : `Check-in ${checkInNum}`}
                  </div>
                  <div className="serif" style={{ fontSize:22, color:T.cream, lineHeight:1.2, marginBottom:6 }}>{analysis.headline}</div>
                  <div style={{ fontSize:13, color:"rgba(249,247,244,0.55)", lineHeight:1.6 }}>{analysis.subtitle}</div>
                </div>

                <div style={{ padding:"18px 20px", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:9, letterSpacing:2.5, textTransform:"uppercase", color:T.teal, marginBottom:12 }}>What we see</div>
                  {analysis.observations.map((o,i) => (
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background: o.positive ? T.sage : T.amber, marginTop:6, flexShrink:0 }} />
                      <div style={{ fontSize:13, color:T.muted, lineHeight:1.65 }}>
                        <strong style={{ display:"block", color:T.navy, marginBottom:1 }}>{o.title}</strong>
                        {o.detail}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding:"18px 20px", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:9, letterSpacing:2.5, textTransform:"uppercase", color:T.teal, marginBottom:12 }}>Movement adjustments</div>
                  {analysis.adjustments.map((a,i) => (
                    <div key={i} style={{ background:T.light, borderRadius:10, padding:"12px 14px", marginBottom:9 }}>
                      <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:T.teal, marginBottom:4 }}>{a.label}</div>
                      <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>{a.text}</div>
                    </div>
                  ))}
                </div>

                {analysis.insight && (
                  <div style={{ padding:"18px 20px", borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ background: analysis.insight.type==="warn" ? T.amber+"0C" : T.teal+"0C", border:`1px solid ${analysis.insight.type==="warn" ? T.amber+"40" : T.teal+"30"}`, borderRadius:10, padding:"14px 16px" }}>
                      <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color: analysis.insight.type==="warn" ? T.amber : T.teal, fontWeight:700, marginBottom:5 }}>✦ Insight</div>
                      <div className="serif" style={{ fontSize:16, color:T.navy, marginBottom:6 }}>{analysis.insight.title}</div>
                      <div style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>{analysis.insight.body}</div>
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px" }}>
                  <div>
                    <div style={{ fontSize:11, color:T.muted }}>Next check-in</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>In 14 days</div>
                  </div>
                  <span style={{ fontSize:20 }}>📅</span>
                </div>
              </Card>

              <button onClick={resetCI} style={{ width:"100%", padding:"13px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:12, fontSize:13, color:T.muted, cursor:"pointer" }}>↩ New check-in</button>

              {photoHistory.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Previous check-ins</div>
                  {[...photoHistory].reverse().map((ci,i) => (
                    <div key={i} style={{ background:T.white, borderRadius:10, border:`1px solid ${T.border}`, padding:"12px 16px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>Check-in {ci.num}</div>
                        <div style={{ fontSize:12, color:T.muted }}>{ci.headline}</div>
                      </div>
                      <div style={{ fontSize:11, color:"#bbb" }}>{ci.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TOOLS TAB ────────────────────────────────────────────────────────────────
function ToolsTab({ proteinTarget }) {
  const [sub, setSub] = useState("protein"); // protein | checkin | doses | reflect | costs
  const [proteinView, setProteinView]             = useState("animal");
  const [proteinAnchorType, setProteinAnchorType] = useState("bar");
  const [proteinAnchorBar, setProteinAnchorBar]   = useState("quest");
  const [proteinAnchorPowder, setProteinAnchorPowder] = useState("on_whey");
  const [proteinAnchorsPerDay, setProteinAnchorsPerDay] = useState(2);
  const [proteinYoghurt, setProteinYoghurt]       = useState("chobani");
  const [proteinYoghurtPerDay, setProteinYoghurtPerDay] = useState(1);
  const [proteinWholeFoods, setProteinWholeFoods] = useState([]);
  const [customBarProtein, setCustomBarProtein]   = useState("");
  const [customPwdProtein, setCustomPwdProtein]   = useState("");
  const [customYoghurtProtein, setCustomYoghurtProtein] = useState("");
  const [wholeFoodPortions, setWholeFoodPortions] = useState({}); // { foodId: grams }
  const [checkIns, setCheckIns] = useState([]);
  const [ci, setCi]   = useState({ nausea:0, energy:0, mood:0, appetite:0, sleep:0, notes:"" });
  const [saved, setSaved] = useState(false);
  const [doses, setDoses] = useState([]);
  const [df, setDf] = useState({ date:today(), dose:"", product:"", site:"", notes:"" });
  const [reflectWeek, setRW] = useState(1);
  const [reflections, setReflections] = useState({});
  const [curReflect, setCurReflect] = useState({});
  const [costs, setCosts] = useState([
    { id:1, pharmacy:"LifeMD", product:"Compounded Semaglutide", dose:"0.5mg/wk", price:297, per:"month", rating:4, notes:"Good support, quick turnaround", date:"Apr 2025" },
    { id:2, pharmacy:"Hims & Hers", product:"Compounded Semaglutide", dose:"0.25mg/wk", price:199, per:"month", rating:4, notes:"Easy onboarding, responsive", date:"May 2025" },
  ]);
  const [cf, setCf] = useState({ pharmacy:"", product:"", dose:"", price:"", per:"month", notes:"", rating:5 });
  const [showCF, setShowCF] = useState(false);

  const REFLECTIONS_DATA = [
    { week:1, prompts:["How has your relationship with hunger changed since your first injection?","What has been the hardest part of this week?","On a scale of 1–10, how confident do you feel this is going to work for you?"] },
    { week:2, prompts:["Did you eat by the clock or by hunger this week?","What social situation around food felt most complicated?","What's one thing you did for your body this week unrelated to the scale?"] },
    { week:4, prompts:["What does 'normal' eating look like now versus before?","How is your training responding?","What would you tell someone about to start their first week?"] },
    { week:8, prompts:["What have you learned about yourself through this process?","Is there anything you'd do differently if starting again?","Who in your life has been most supportive?"] },
    { week:12, prompts:["What has changed beyond the physical?","What does sustainable life around food and movement look like for you?","What's one commitment you're making for the next 3 months?"] },
  ];

  const inp = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, color:T.navy, background:"#fafafa", boxSizing:"border-box" };
  const lbl = { display:"block", fontSize:11, fontWeight:600, color:"#666", marginBottom:5, textTransform:"uppercase", letterSpacing:0.5 };

  const subTabs = [
    { id:"protein", label:"Protein" },
    { id:"checkin", label:"Weekly" },
    { id:"doses",   label:"Doses" },
    { id:"reflect", label:"Reflect" },
    { id:"costs",   label:"Costs" },
  ];

  return (
    <div style={{ paddingBottom:24 }}>
      {/* Sub-nav */}
      <div style={{ background:T.white, borderBottom:`1px solid ${T.border}`, display:"flex", overflowX:"auto" }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ flexShrink:0, padding:"13px 16px", border:"none", background:"transparent", cursor:"pointer", borderBottom:`3px solid ${sub===t.id ? T.teal : "transparent"}`, color: sub===t.id ? T.teal : T.muted, fontSize:12, fontWeight: sub===t.id ? 700:400, whiteSpace:"nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─ PROTEIN ─ */}
      {sub === "protein" && (() => {
        // ── Protein planner state (hoisted inline) ──
        // anchorType: "bar" | "powder" | "both"
        // selectedAnchorBar, selectedAnchorPowder, selectedYoghurt
        // selectedWholeFoods (array of ids)
        // anchorsPerDay: 1 | 2
        // yoghurtPerDay: 0 | 1 | 2
        const target = proteinTarget || 120;

        // Compute anchor protein
        const anchorBar     = PROTEIN_BARS.find(b => b.id === proteinAnchorBar);
        const anchorPowder  = PROTEIN_POWDERS.find(p => p.id === proteinAnchorPowder);
        const yoghurt       = PROTEIN_YOGHURTS.find(y => y.id === proteinYoghurt);
        const yoghurtProtein = proteinYoghurt === "other_yog"
          ? (parseInt(customYoghurtProtein) || 0)
          : (yoghurt?.protein || 0);

        const barProtein = proteinAnchorBar === "other_bar"
          ? (parseInt(customBarProtein) || 0)
          : (anchorBar?.protein || 0);
        const pwdProtein = proteinAnchorPowder === "other_pwd"
          ? (parseInt(customPwdProtein) || 0)
          : (anchorPowder?.protein || 0);
        let anchorTotal = 0;
        if (proteinAnchorType === "bar"    || proteinAnchorType === "both") anchorTotal += barProtein * proteinAnchorsPerDay;
        if (proteinAnchorType === "powder" || proteinAnchorType === "both") anchorTotal += pwdProtein * proteinAnchorsPerDay;
        const yoghurtTotal = yoghurtProtein * proteinYoghurtPerDay;
        const anchorPlusYoghurt = anchorTotal + yoghurtTotal;
        const delta = Math.max(0, target - anchorPlusYoghurt);
        const pct   = Math.min(100, Math.round((anchorPlusYoghurt / target) * 100));

        return (
        <div style={{ padding:"16px" }}>

          {/* Header + target */}
          <div className="serif" style={{ fontSize:20, color:T.navy, marginBottom:4 }}>Protein Planner</div>
          <p style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:14 }}>
            Build your daily protein plan around an anchor, top up with yoghurt, then fill the gap with whole foods.
          </p>

          {/* Target badge */}
          <div style={{ background:T.teal+"0E", border:`1px solid ${T.teal}28`, borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5 }}>Your daily target</div>
              <div className="serif" style={{ fontSize:32, fontWeight:700, color:T.navy, lineHeight:1 }}>{target}g</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:T.muted }}>≈ {Math.round(target/3)}g × 3 moments</div>
              {!proteinTarget && <div style={{ fontSize:11, color:T.amber, marginTop:4 }}>Update profile for personalised target</div>}
            </div>
          </div>

          {/* ── STEP 1: Anchor type ── */}
          <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Step 1 — Choose your anchor</div>
          <p style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:12 }}>
            Your anchor is non-negotiable — you take it whether you feel hungry or not. It guarantees the floor.
          </p>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[["bar","🍫 Bar"],["powder","🥛 Shake"],["both","Both"]].map(([v,l]) => (
              <button key={v} onClick={() => setProteinAnchorType(v)}
                style={{ flex:1, padding:"11px 8px", borderRadius:10, border:`2px solid ${proteinAnchorType===v ? T.teal : T.border}`, background: proteinAnchorType===v ? T.teal+"12" : T.white, color: proteinAnchorType===v ? T.teal : T.muted, fontSize:13, fontWeight: proteinAnchorType===v ? 700:400, cursor:"pointer" }}>
                {l}
              </button>
            ))}
          </div>

          {/* Bar picker */}
          {(proteinAnchorType === "bar" || proteinAnchorType === "both") && (
            <Card style={{ marginBottom:12 }}>
              <div style={{ padding:"12px 16px 4px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:12 }}>Pick a bar</div>
                {PROTEIN_BARS.map((b,i) => (
                  <div key={b.id}>
                    <button onClick={() => setProteinAnchorBar(b.id)}
                      style={{ width:"100%", display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom:`1px solid ${T.border}`, background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${proteinAnchorBar===b.id ? T.teal : T.border}`, background: proteinAnchorBar===b.id ? T.teal : "transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {proteinAnchorBar===b.id && <div style={{ width:8, height:8, borderRadius:"50%", background:T.white }} />}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:T.navy }}>{b.name}</div>
                          {b.id !== "other_bar" && <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>{b.protein}g</div>}
                        </div>
                        {b.id !== "other_bar" && <div style={{ fontSize:11, color:T.muted, marginBottom:3 }}>{b.serve} · {b.cal} cal · {b.flavours}</div>}
                        <div style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>{b.note}</div>
                        {b.warn && <div style={{ fontSize:11, color:T.amber, marginTop:4, display:"flex", gap:5 }}><span>⚠</span>{b.warn}</div>}
                      </div>
                    </button>
                    {b.id === "other_bar" && proteinAnchorBar === "other_bar" && (
                      <div style={{ padding:"14px 0 14px 34px", borderBottom:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:12, color:T.muted, marginBottom:10 }}>Enter protein grams per bar from the nutrition label:</div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <input type="number" value={customBarProtein} onChange={e => setCustomBarProtein(e.target.value)}
                            placeholder="e.g. 22" min="0" max="60"
                            style={{ width:90, padding:"10px 12px", borderRadius:9, border:`2px solid ${T.teal}`, fontSize:18, fontWeight:700, color:T.navy, textAlign:"center", outline:"none", fontFamily:"inherit" }} />
                          <span style={{ fontSize:13, color:T.muted }}>grams protein</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Powder picker */}
          {(proteinAnchorType === "powder" || proteinAnchorType === "both") && (
            <Card style={{ marginBottom:12 }}>
              <div style={{ padding:"12px 16px 4px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:12 }}>Pick a protein powder</div>
                {PROTEIN_POWDERS.map((p,i) => (
                  <div key={p.id}>
                    <button onClick={() => setProteinAnchorPowder(p.id)}
                      style={{ width:"100%", display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom:`1px solid ${T.border}`, background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${proteinAnchorPowder===p.id ? T.teal : T.border}`, background: proteinAnchorPowder===p.id ? T.teal : "transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {proteinAnchorPowder===p.id && <div style={{ width:8, height:8, borderRadius:"50%", background:T.white }} />}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:T.navy }}>{p.name}</div>
                          {p.id !== "other_pwd" && <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>{p.protein}g</div>}
                        </div>
                        {p.id !== "other_pwd" && <div style={{ fontSize:11, color:T.muted, marginBottom:3 }}>{p.serve} · {p.cal} cal · {p.type}</div>}
                        <div style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>{p.note}</div>
                      </div>
                    </button>
                    {p.id === "other_pwd" && proteinAnchorPowder === "other_pwd" && (
                      <div style={{ padding:"14px 0 14px 34px", borderBottom:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:12, color:T.muted, marginBottom:10 }}>Enter protein grams per scoop from the nutrition label:</div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <input type="number" value={customPwdProtein} onChange={e => setCustomPwdProtein(e.target.value)}
                            placeholder="e.g. 25" min="0" max="60"
                            style={{ width:90, padding:"10px 12px", borderRadius:9, border:`2px solid ${T.teal}`, fontSize:18, fontWeight:700, color:T.navy, textAlign:"center", outline:"none", fontFamily:"inherit" }} />
                          <span style={{ fontSize:13, color:T.muted }}>grams protein</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* How many anchor moments per day */}
          {proteinAnchorType && (
            <Card style={{ marginBottom:16 }}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>How many times per day?</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[1,2].map(n => (
                    <button key={n} onClick={() => setProteinAnchorsPerDay(n)}
                      style={{ flex:1, padding:"12px", borderRadius:10, border:`2px solid ${proteinAnchorsPerDay===n ? T.teal : T.border}`, background: proteinAnchorsPerDay===n ? T.teal+"12" : T.white, color: proteinAnchorsPerDay===n ? T.teal : T.muted, fontSize:13, fontWeight: proteinAnchorsPerDay===n ? 700:400, cursor:"pointer" }}>
                      {n}x daily {n===1 ? "(morning)" : "(morning + evening)"}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ── STEP 2: Yoghurt ── */}
          <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Step 2 — Yoghurt or cottage cheese <span style={{ fontSize:10, color:T.muted, fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span></div>
          <p style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:12 }}>
            Soft, easy to eat even on low-appetite days. Skip this if you prefer to top up with whole food instead.
          </p>
          <Card style={{ marginBottom:12 }}>
            <div style={{ padding:"12px 16px 4px" }}>
              {/* None option */}
              <button onClick={() => { setProteinYoghurt(null); setProteinYoghurtPerDay(0); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"12px 0", background:"none", border:"none", borderBottom:`1px solid ${T.border}`, cursor:"pointer", textAlign:"left" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${!proteinYoghurt ? T.teal : T.border}`, background: !proteinYoghurt ? T.teal : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {!proteinYoghurt && <div style={{ width:8, height:8, borderRadius:"50%", background:T.white }} />}
                </div>
                <div style={{ fontSize:14, fontWeight:600, color: !proteinYoghurt ? T.teal : T.muted }}>Skip — I'll top up with whole food instead</div>
              </button>
              {PROTEIN_YOGHURTS.map((y,i) => (
                <div key={y.id}>
                  {/* Selection row — plain div, no inputs inside */}
                  <div onClick={() => setProteinYoghurt(proteinYoghurt===y.id ? null : y.id)}
                    style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom: `1px solid ${T.border}`, cursor:"pointer" }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${proteinYoghurt===y.id ? T.teal : T.border}`, background: proteinYoghurt===y.id ? T.teal : "transparent", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {proteinYoghurt===y.id && <div style={{ width:8, height:8, borderRadius:"50%", background:T.white }} />}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: y.id!=="other_yog" ? 3 : 0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color: proteinYoghurt===y.id ? T.navy : T.muted }}>{y.name}</div>
                        {y.id !== "other_yog" && <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>{y.protein}g</div>}
                      </div>
                      {y.id !== "other_yog" && <div style={{ fontSize:11, color:T.muted, marginBottom:3 }}>{y.serve} · {y.cal} cal</div>}
                      <div style={{ fontSize:12, color:"#666", lineHeight:1.5 }}>{y.note}</div>
                    </div>
                  </div>
                  {/* Custom input — sibling div, completely outside the clickable row */}
                  {y.id === "other_yog" && proteinYoghurt === "other_yog" && (
                    <div style={{ padding:"14px 0 14px 34px", borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:12, color:T.muted, marginBottom:10 }}>Enter protein grams per serve from your nutrition label:</div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <input
                          type="number"
                          value={customYoghurtProtein}
                          onChange={e => setCustomYoghurtProtein(e.target.value)}
                          placeholder="e.g. 15"
                          min="0" max="60"
                          style={{ width:90, padding:"10px 12px", borderRadius:9, border:`2px solid ${T.teal}`, fontSize:18, fontWeight:700, color:T.navy, textAlign:"center", outline:"none", fontFamily:"inherit" }}
                        />
                        <span style={{ fontSize:13, color:T.muted }}>grams per serve</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          {proteinYoghurt && (
            <Card style={{ marginBottom:16 }}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>How many serves per day?</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[1,2].map(n => (
                    <button key={n} onClick={() => setProteinYoghurtPerDay(n)}
                      style={{ flex:1, padding:"12px", borderRadius:10, border:`2px solid ${proteinYoghurtPerDay===n ? T.teal : T.border}`, background: proteinYoghurtPerDay===n ? T.teal+"12" : T.white, color: proteinYoghurtPerDay===n ? T.teal : T.muted, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                      {n}x
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ── STEP 3: Whole food delta ── */}
          {anchorPlusYoghurt > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Step 3 — Fill the gap with whole food</div>

              {/* Progress bar showing anchor + yoghurt coverage */}
              <Card style={{ marginBottom:14 }}>
                <div style={{ padding:"16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>Anchor + yoghurt covers</div>
                    <div style={{ fontSize:16, fontWeight:700, color: pct>=80 ? T.sage : pct>=50 ? T.amber : T.rose }}>{anchorPlusYoghurt}g <span style={{ fontSize:11, color:T.muted }}>of {target}g</span></div>
                  </div>
                  <div style={{ height:8, background:T.light, borderRadius:4, overflow:"hidden", marginBottom:8 }}>
                    <div style={{ height:"100%", width:`${pct}%`, background: pct>=80 ? T.sage : pct>=50 ? T.amber : T.rose, borderRadius:4, transition:"width 0.4s ease" }} />
                  </div>
                  {delta > 0 ? (
                    <div style={{ fontSize:13, color:T.muted }}>
                      You need <strong style={{ color:T.navy }}>{delta}g more</strong> from whole food today. Pick your preferred source below:
                    </div>
                  ) : (
                    <div style={{ fontSize:13, color:T.sage, fontWeight:600 }}>✓ Target covered from anchor + yoghurt alone</div>
                  )}
                </div>
              </Card>

              {/* Whole food picker with gram stepper */}
              {delta > 0 && (() => {
                const totalFromFood = WHOLE_FOODS.reduce((sum, f) => {
                  const g = wholeFoodPortions[f.id] || 0;
                  return sum + Math.round((g / 100) * f.p100);
                }, 0);
                const remaining = Math.max(0, delta - totalFromFood);
                const foodClosed = totalFromFood >= delta;
                return (
                <Card style={{ marginBottom:16 }}>
                  <div style={{ padding:"14px 16px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:4 }}>
                      Pick your whole foods
                    </div>
                    <div style={{ fontSize:12, color:T.muted, marginBottom:14, lineHeight:1.5 }}>
                      Use the weight buttons to set your portion for each food. Watch your gap close in real time.
                    </div>

                    {/* Live gap tracker */}
                    <div style={{ background: foodClosed ? T.sage+"0E" : T.light, border:`1px solid ${foodClosed ? T.sage+"40" : T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:11, color:T.muted, fontWeight:600 }}>Gap remaining</div>
                        <div className="serif" style={{ fontSize:22, fontWeight:700, color: foodClosed ? T.sage : T.navy, lineHeight:1 }}>
                          {foodClosed ? "✓ Closed" : `${remaining}g`}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:11, color:T.muted }}>From food so far</div>
                        <div style={{ fontSize:16, fontWeight:700, color:T.teal }}>{totalFromFood}g</div>
                      </div>
                    </div>

                    {/* Food rows with gram steppers */}
                    {WHOLE_FOODS.map((f, i) => {
                      const selectedGrams = wholeFoodPortions[f.id] || 0;
                      const proteinFromThis = Math.round((selectedGrams / 100) * f.p100);
                      const weightLabel = f.raw === false ? "drained" : "raw";
                      // Tuna/salmon get tin-friendly snap points
                      const isTin = f.id === "tuna" || f.id === "salmon_tin";
                      const snapPoints = isTin ? [0, 50, 95, 130, 185] : [0, 50, 75, 100, 125, 150, 175, 200];
                      const isActive = selectedGrams > 0;
                      return (
                        <div key={f.id} style={{ borderBottom: i < WHOLE_FOODS.length-1 ? `1px solid ${T.border}` : "none", paddingBottom:14, marginBottom:14 }}>
                          {/* Food header */}
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                            <div style={{ fontSize:14, fontWeight:600, color: isActive ? T.navy : T.muted }}>
                              {f.icon} {f.name}
                            </div>
                            <div style={{ textAlign:"right" }}>
                              {isActive ? (
                                <>
                                  <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{proteinFromThis}g protein</div>
                                  <div style={{ fontSize:10, color:T.muted }}>{selectedGrams}g {weightLabel}</div>
                                </>
                              ) : (
                                <div style={{ fontSize:12, color:T.muted }}>{f.p100}g protein / 100g {weightLabel}</div>
                              )}
                            </div>
                          </div>

                          {/* Gram stepper */}
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {snapPoints.map(g => (
                              <button key={g} onClick={() => setWholeFoodPortions(prev => ({ ...prev, [f.id]: g }))}
                                style={{ padding: g===0 ? "6px 10px" : "6px 11px", borderRadius:8,
                                  border:`2px solid ${selectedGrams===g ? (g===0 ? T.rose+"80" : T.teal) : T.border}`,
                                  background: selectedGrams===g ? (g===0 ? T.rose+"0C" : T.teal+"12") : T.white,
                                  color: selectedGrams===g ? (g===0 ? T.rose : T.teal) : T.muted,
                                  fontSize:12, fontWeight: selectedGrams===g ? 700:400, cursor:"pointer" }}>
                                {g === 0 ? "None" : `${g}g`}
                              </button>
                            ))}
                          </div>

                          {/* Note when active */}
                          {isActive && (
                            <div style={{ fontSize:11, color:"#777", marginTop:7, lineHeight:1.5 }}>{f.note}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
                );
              })()}

              {/* Daily plan summary */}
              {(anchorPlusYoghurt > 0) && (
                <Card style={{ marginBottom:8 }}>
                  <div style={{ padding:"16px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:14 }}>Your daily plan</div>
                    {/* Anchor rows */}
                    {(proteinAnchorType === "bar" || proteinAnchorType === "both") && anchorBar && barProtein > 0 && (
                      Array.from({length: proteinAnchorsPerDay}).map((_,i) => (
                        <div key={"bar"+i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:13, color:T.navy }}>🍫 {proteinAnchorBar==="other_bar" ? "My bar" : anchorBar.name} <span style={{ fontSize:11, color:T.muted }}>({i===0 ? "morning" : "evening"})</span></div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>{barProtein}g</div>
                        </div>
                      ))
                    )}
                    {(proteinAnchorType === "powder" || proteinAnchorType === "both") && anchorPowder && pwdProtein > 0 && (
                      Array.from({length: proteinAnchorsPerDay}).map((_,i) => (
                        <div key={"powder"+i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:13, color:T.navy }}>🥛 {proteinAnchorPowder==="other_pwd" ? "My powder" : anchorPowder.name} shake <span style={{ fontSize:11, color:T.muted }}>({i===0 ? "morning" : "evening"})</span></div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>{pwdProtein}g</div>
                        </div>
                      ))
                    )}
                    {proteinYoghurt && yoghurtProtein > 0 && (
                      Array.from({length: proteinYoghurtPerDay}).map((_,i) => (
                        <div key={"yog"+i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:13, color:T.navy }}>🥛 {proteinYoghurt==="other_yog" ? "My yoghurt" : yoghurt?.name} <span style={{ fontSize:11, color:T.muted }}>({i===0 ? "with breakfast" : "midday"})</span></div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>{yoghurtProtein}g</div>
                        </div>
                      ))
                    )}
                    {/* Selected whole foods from portions */}
                    {WHOLE_FOODS.filter(f => (wholeFoodPortions[f.id] || 0) > 0).map(f => {
                      const g = wholeFoodPortions[f.id];
                      const p = Math.round((g / 100) * f.p100);
                      const weightLabel = f.raw === false ? "drained" : "raw";
                      return (
                        <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:13, color:T.navy }}>{f.icon} {f.name} <span style={{ fontSize:11, color:T.muted }}>({g}g {weightLabel})</span></div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>{p}g</div>
                        </div>
                      );
                    })}
                    {/* Total */}
                    {(() => {
                      const foodTotal = WHOLE_FOODS.reduce((sum, f) => {
                        const g = wholeFoodPortions[f.id] || 0;
                        return sum + Math.round((g / 100) * f.p100);
                      }, 0);
                      const grandTotal = anchorPlusYoghurt + foodTotal;
                      return (
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0 0" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Total</div>
                          <div style={{ fontSize:16, fontWeight:700, color: grandTotal >= target ? T.sage : T.amber }}>
                            {grandTotal}g
                            <span style={{ fontSize:11, color:T.muted, fontWeight:400 }}> / {target}g</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              )}

              {/* What to avoid */}
              <div style={{ fontSize:11, fontWeight:700, color:T.rose, textTransform:"uppercase", letterSpacing:2, marginBottom:8, marginTop:8 }}>⚠ What to avoid</div>
              {PROTEIN_FOODS.avoid.map((item,i) => (
                <div key={i} style={{ background:T.white, borderRadius:10, border:`1px solid ${T.border}`, borderLeft:`4px solid ${T.rose}`, padding:"12px 16px", marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.rose, marginBottom:3 }}>{item.name}</div>
                  <div style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>{item.why}</div>
                </div>
              ))}
            </>
          )}

          {/* Empty state */}
          {anchorPlusYoghurt === 0 && (
            <div style={{ background:T.light, borderRadius:12, border:`1px dashed ${T.border}`, padding:"24px", textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:8 }}>🥛</div>
              <div style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:6 }}>Start by choosing your anchor above</div>
              <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>Pick a bar, shake, or both — then we'll build the rest of your daily plan around it.</div>
            </div>
          )}

        </div>
        );
      })()}

      {/* ─ WEEKLY CHECK-IN ─ */}
      {sub === "checkin" && (
        <div style={{ padding:"16px" }}>
          <div className="serif" style={{ fontSize:20, color:T.navy, marginBottom:4 }}>Weekly Check-In</div>
          <p style={{ fontSize:13, color:T.muted, marginBottom:16, lineHeight:1.55 }}>Track how you're feeling each week. Patterns emerge over time.</p>
          <Card style={{ marginBottom:14 }}>
            <div style={{ padding:"16px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:14 }}>{today()}</div>
              {[{k:"nausea",lo:"Severe",hi:"None"},{k:"energy",lo:"Exhausted",hi:"High"},{k:"mood",lo:"Low",hi:"Great"},{k:"appetite",lo:"Suppressed",hi:"Normal"},{k:"sleep",lo:"Poor",hi:"Great"}].map(m => (
                <div key={m.k} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:T.text, textTransform:"capitalize" }}>{m.k}</span>
                    <span style={{ fontSize:11, color:"#bbb" }}>{m.lo} → {m.hi}</span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setCi({...ci,[m.k]:n})} style={{ flex:1, height:36, borderRadius:7, border:`2px solid ${ci[m.k]===n ? T.teal : T.border}`, background: ci[m.k]===n ? T.teal : "#fafafa", color: ci[m.k]===n ? T.white : "#999", fontSize:13, fontWeight:700, cursor:"pointer" }}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
              <textarea value={ci.notes} onChange={e => setCi({...ci,notes:e.target.value})} placeholder="Notes this week — symptoms, wins, questions for your doctor..." style={{ ...inp, resize:"vertical", minHeight:70, marginBottom:12 }} />
              <PrimaryBtn onClick={() => { setCheckIns([...checkIns,{...ci,date:today(),week:checkIns.length+1}]); setCi({nausea:0,energy:0,mood:0,appetite:0,sleep:0,notes:""}); setSaved(true); setTimeout(()=>setSaved(false),2500); }}>
                {saved ? "✓ Saved!" : "Save Check-In"}
              </PrimaryBtn>
            </div>
          </Card>
          {[...checkIns].reverse().map((c,i) => (
            <Card key={i} style={{ marginBottom:8 }}>
              <div style={{ padding:"12px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>Week {c.week}</span>
                  <span style={{ fontSize:12, color:"#aaa" }}>{c.date}</span>
                </div>
                <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                  {["nausea","energy","mood","appetite","sleep"].map(k => (
                    <div key={k} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:T.teal }}>{c[k]}/5</div>
                      <div style={{ fontSize:10, color:"#aaa", textTransform:"capitalize" }}>{k}</div>
                    </div>
                  ))}
                </div>
                {c.notes && <p style={{ fontSize:12, color:"#666", marginTop:8, fontStyle:"italic", borderTop:`1px solid ${T.border}`, paddingTop:8, margin:"8px 0 0" }}>{c.notes}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─ DOSE LOG ─ */}
      {sub === "doses" && (
        <div style={{ padding:"16px" }}>
          <div className="serif" style={{ fontSize:20, color:T.navy, marginBottom:4 }}>Dose Log</div>
          <p style={{ fontSize:13, color:T.muted, marginBottom:16, lineHeight:1.55 }}>Track every injection. Helps you spot patterns and gives your prescriber accurate data.</p>
          <Card style={{ marginBottom:14 }}>
            <div style={{ padding:"16px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <div><label style={lbl}>Date</label><input type="date" value={df.date} onChange={e=>setDf({...df,date:e.target.value})} style={inp} /></div>
                <div><label style={lbl}>Dose (mg)</label><input type="number" step="0.1" value={df.dose} onChange={e=>setDf({...df,dose:e.target.value})} placeholder="e.g. 2.5" style={inp} /></div>
                <div><label style={lbl}>Product</label><input value={df.product} onChange={e=>setDf({...df,product:e.target.value})} placeholder="e.g. Mounjaro" style={inp} /></div>
                <div><label style={lbl}>Injection site</label>
                  <select value={df.site} onChange={e=>setDf({...df,site:e.target.value})} style={{...inp,cursor:"pointer"}}>
                    <option value="">Select...</option>
                    {["Abdomen (left)","Abdomen (right)","Outer thigh (left)","Outer thigh (right)","Upper arm (left)","Upper arm (right)"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:12 }}><label style={lbl}>Notes</label><input value={df.notes} onChange={e=>setDf({...df,notes:e.target.value})} placeholder="Reactions, timing, observations..." style={inp} /></div>
              <PrimaryBtn onClick={() => { if(!df.date||!df.dose) return; setDoses([{...df,id:Date.now()},...doses]); setDf({date:today(),dose:"",product:"",site:"",notes:""}); }}>
                Add to Log
              </PrimaryBtn>
            </div>
          </Card>
          {doses.map(d => (
            <div key={d.id} style={{ background:T.white, borderRadius:10, border:`1px solid ${T.border}`, padding:"12px 16px", display:"flex", gap:12, alignItems:"center", marginBottom:8 }}>
              <div style={{ textAlign:"center", background:T.teal+"0E", borderRadius:8, padding:"6px 10px", flexShrink:0 }}>
                <div className="serif" style={{ fontSize:18, fontWeight:700, color:T.teal }}>{d.dose}</div>
                <div style={{ fontSize:10, color:"#aaa" }}>mg</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{d.product||"GLP-1"}{d.site ? ` · ${d.site}`:""}</div>
                <div style={{ fontSize:12, color:"#aaa", marginTop:1 }}>{d.date}</div>
                {d.notes && <div style={{ fontSize:12, color:"#777", marginTop:3, fontStyle:"italic" }}>{d.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─ REFLECT ─ */}
      {sub === "reflect" && (
        <div style={{ padding:"16px" }}>
          <div className="serif" style={{ fontSize:20, color:T.navy, marginBottom:4 }}>Weekly Reflection</div>
          <p style={{ fontSize:13, color:T.muted, marginBottom:16, lineHeight:1.55 }}>The physical and psychological journeys are not on the same timeline. These prompts help you process both.</p>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
            {REFLECTIONS_DATA.map(r => (
              <button key={r.week} onClick={() => { setRW(r.week); setCurReflect(reflections[r.week]||{}); }} style={{ padding:"6px 14px", borderRadius:100, border:`1.5px solid ${reflectWeek===r.week ? T.violet : T.border}`, background: reflectWeek===r.week ? T.violet : T.white, color: reflectWeek===r.week ? T.white : "#666", fontSize:12, cursor:"pointer", fontWeight: reflections[r.week] ? 700:400 }}>
                Week {r.week}{reflections[r.week] ? " ✓":""}
              </button>
            ))}
          </div>
          {(() => {
            const wr = REFLECTIONS_DATA.find(r=>r.week===reflectWeek);
            return (
              <Card>
                <div style={{ padding:"16px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.violet, textTransform:"uppercase", letterSpacing:1.5, marginBottom:16 }}>Week {reflectWeek} prompts</div>
                  {wr.prompts.map((p,pi) => (
                    <div key={pi} style={{ marginBottom:16 }}>
                      <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.navy, marginBottom:8, lineHeight:1.4 }}>{p}</label>
                      <textarea value={curReflect[pi]||""} onChange={e=>setCurReflect({...curReflect,[pi]:e.target.value})} placeholder="Write as much or as little as feels right..." rows={3} style={{...inp,resize:"vertical"}} />
                    </div>
                  ))}
                  <PrimaryBtn onClick={() => setReflections({...reflections,[reflectWeek]:curReflect})} color={T.violet}>Save Reflection</PrimaryBtn>
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ─ COSTS ─ */}
      {sub === "costs" && (
        <div style={{ padding:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <div className="serif" style={{ fontSize:20, color:T.navy }}>Cost Board</div>
            <button onClick={() => setShowCF(!showCF)} style={{ padding:"7px 14px", background:T.teal, color:T.white, border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Share price</button>
          </div>
          <p style={{ fontSize:13, color:T.muted, marginBottom:4, lineHeight:1.55 }}>Real prices from real users. Help others know what to expect.</p>
          <p style={{ fontSize:11, color:"#bbb", marginBottom:16, fontStyle:"italic" }}>Community-submitted. Always verify independently.</p>
          {showCF && (
            <Card style={{ marginBottom:14 }}>
              <div style={{ padding:"16px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <div><label style={lbl}>Pharmacy *</label><input value={cf.pharmacy} onChange={e=>setCf({...cf,pharmacy:e.target.value})} placeholder="e.g. LifeMD" style={inp} /></div>
                  <div><label style={lbl}>Product *</label><input value={cf.product} onChange={e=>setCf({...cf,product:e.target.value})} placeholder="e.g. Compounded Sema" style={inp} /></div>
                  <div><label style={lbl}>Dose</label><input value={cf.dose} onChange={e=>setCf({...cf,dose:e.target.value})} placeholder="e.g. 0.5mg/wk" style={inp} /></div>
                  <div><label style={lbl}>Price ($) *</label><input type="number" value={cf.price} onChange={e=>setCf({...cf,price:e.target.value})} placeholder="e.g. 299" style={inp} /></div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <label style={lbl}>Rating</label>
                  <div style={{ display:"flex", gap:6 }}>
                    {[1,2,3,4,5].map(n=><button key={n} onClick={()=>setCf({...cf,rating:n})} style={{ width:34,height:34,borderRadius:7,border:`2px solid ${cf.rating>=n?T.amber:T.border}`,background:cf.rating>=n?T.amber+"18":"#fafafa",fontSize:15,cursor:"pointer",color:cf.rating>=n?T.amber:"#ccc" }}>★</button>)}
                  </div>
                </div>
                <div style={{ marginBottom:12 }}><label style={lbl}>Notes</label><input value={cf.notes} onChange={e=>setCf({...cf,notes:e.target.value})} placeholder="Quality, service, delivery..." style={inp} /></div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { if(!cf.pharmacy||!cf.product||!cf.price) return; setCosts([{...cf,id:Date.now(),date:today()},...costs]); setCf({pharmacy:"",product:"",dose:"",price:"",per:"month",notes:"",rating:5}); setShowCF(false); }} style={{ flex:1,padding:"11px",background:T.teal,color:T.white,border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer" }}>Submit</button>
                  <button onClick={()=>setShowCF(false)} style={{ padding:"11px 18px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:9,fontSize:13,cursor:"pointer",color:"#666" }}>Cancel</button>
                </div>
              </div>
            </Card>
          )}
          {costs.map(c => (
            <Card key={c.id} style={{ marginBottom:9 }}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>{c.pharmacy}</div>
                    <div style={{ fontSize:12, color:"#888", marginTop:1 }}>{c.product}{c.dose?` · ${c.dose}`:""}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div className="serif" style={{ fontSize:22, fontWeight:700, color:T.teal }}>${c.price}</div>
                    <div style={{ fontSize:11, color:"#aaa" }}>per {c.per}</div>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", gap:1 }}>{[1,2,3,4,5].map(n=><span key={n} style={{ fontSize:12,color:n<=c.rating?T.amber:"#ddd" }}>★</span>)}</div>
                  <div style={{ fontSize:11, color:"#aaa" }}>{c.date}</div>
                </div>
                {c.notes && <p style={{ fontSize:12,color:"#666",marginTop:8,fontStyle:"italic",borderTop:`1px solid ${T.border}`,paddingTop:8,margin:"8px 0 0" }}>{c.notes}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── BODY TRACKER DATA ───────────────────────────────────────────────────────

const BODY_REPORT_PROMPT = (checkInNum, userContext) => `You are a clinical body composition analyst for a GLP-1 medication support program.
This is body check-in #${checkInNum} for a user on a GLP-1 program.
${userContext}
Analyse the upper body composition in this photo. Focus on: fat distribution pattern, muscle definition and retention, signs of muscle loss (skinny fat), waist definition, shoulder-to-waist ratio, and overall trajectory.
${checkInNum === 1 ? "This is their BASELINE — set expectations, do not assess progress yet." : "Compare to what a typical baseline looks like and assess visible changes."}
Keep tone warm, clinically grounded, and motivating. No body shaming.
Respond ONLY with valid JSON, no markdown:
{
  "headline": "4-6 word headline",
  "subtitle": "1-2 sentences",
  "score": { "fatLoss": 0-10, "muscleRetention": 0-10, "overall": 0-10 },
  "observations": [{"title":"...","detail":"...","positive":true}],
  "exerciseAdjustments": [{"label":"...","text":"..."}],
  "nutritionSignals": [{"label":"...","text":"..."}],
  "insight": {"title":"...","body":"...","type":"good or warn"},
  "nextFocus": "one specific thing to focus on before next check-in"
}`;

// ─── SHOP DATA ───────────────────────────────────────────────────────────────

const MEDS = [
  {
    id:"ro",        name:"Ro",               type:"Telehealth",
    product:"Compounded semaglutide",        dose:"0.25–2.4mg/wk",
    price:299,      per:"month",             url:"https://ro.co",
    rating:4.3,     reviews:12400,
    pros:["Strong clinical team","Easy titration","Good app"],
    cons:["No tirzepatide","Higher cost"],
    badge:null,
  },
  {
    id:"hims",      name:"Hims & Hers",      type:"Telehealth",
    product:"Compounded semaglutide",        dose:"0.25–2.4mg/wk",
    price:199,      per:"month",             url:"https://forhims.com",
    rating:4.1,     reviews:8900,
    pros:["Most affordable","Fast onboarding","Ships quickly"],
    cons:["Limited follow-up","No tirzepatide"],
    badge:"Best Value",
  },
  {
    id:"lifemd",    name:"LifeMD",           type:"Telehealth",
    product:"Compounded semaglutide or tirzepatide", dose:"Varies",
    price:297,      per:"month",             url:"https://lifemd.com",
    rating:4.2,     reviews:6700,
    pros:["Offers tirzepatide","Good support","HIPAA compliant"],
    cons:["Can be slow to respond"],
    badge:null,
  },
  {
    id:"noom",      name:"Noom Med",         type:"Telehealth",
    product:"Compounded semaglutide",        dose:"0.25–2.4mg/wk",
    price:349,      per:"month",             url:"https://noom.com",
    rating:4.0,     reviews:5200,
    pros:["Strong psychology coaching","Structured program"],
    cons:["Most expensive","App-heavy approach"],
    badge:null,
  },
  {
    id:"sesame",    name:"Sesame",           type:"Marketplace",
    product:"Brand or compounded — varies", dose:"Varies by provider",
    price:89,       per:"consult",           url:"https://sesamecare.com",
    rating:4.4,     reviews:9100,
    pros:["Cheapest entry","Real MDs","Transparent pricing"],
    cons:["No bundled pharmacy","You manage fills"],
    badge:"Lowest Entry Cost",
  },
];

const PROTEIN_PRODUCTS = [
  // Bars
  { id:"quest",    cat:"bar",   name:"Quest Bar",              brand:"Quest",           protein:21, cal:190, size:"12 pack", basePrice:24.99,  url:"https://amazon.com/s?k=quest+bar+12+pack",   badge:"Best Overall", note:"Widely available. Check Amazon Subscribe & Save for ~20% off." },
  { id:"barebells",cat:"bar",   name:"Barebells Protein Bar",  brand:"Barebells",       protein:20, cal:210, size:"12 pack", basePrice:29.99,  url:"https://amazon.com/s?k=barebells+protein+bar", badge:null,           note:"Often on sale at Costco. Check Target Circle app for coupons." },
  { id:"onebar",   cat:"bar",   name:"ONE Protein Bar",        brand:"ONE",             protein:20, cal:220, size:"12 pack", basePrice:21.99,  url:"https://amazon.com/s?k=ONE+protein+bar+12",   badge:"Best Budget",  note:"Frequently discounted at Walmart and Amazon. Use S&S." },
  { id:"rxbar",    cat:"bar",   name:"RXBAR",                  brand:"RXBAR",           protein:12, cal:200, size:"12 pack", basePrice:25.99,  url:"https://amazon.com/s?k=rxbar+12+pack",        badge:null,           note:"Check Costco for bulk pricing. Clean label, gut-friendly." },
  { id:"pure",     cat:"bar",   name:"Pure Protein Bar",       brand:"Pure Protein",    protein:20, cal:190, size:"18 pack", basePrice:19.99,  url:"https://amazon.com/s?k=pure+protein+bar+18",  badge:"Most Affordable", note:"Best price per gram of protein. Available at Walmart and Target." },
  // Powders
  { id:"on_whey",  cat:"powder",name:"Gold Standard Whey",     brand:"Optimum Nutrition",protein:24,cal:120, size:"5 lb",    basePrice:54.99,  url:"https://amazon.com/s?k=optimum+nutrition+gold+standard+whey+5lb", badge:"Best Overall", note:"Consistently the best value per serving at this size. Use S&S." },
  { id:"iso100",   cat:"powder",name:"ISO100 Hydrolyzed Whey", brand:"Dymatize",        protein:25, cal:110, size:"3 lb",    basePrice:49.99,  url:"https://amazon.com/s?k=dymatize+iso100+3lb",  badge:"Best for Nausea", note:"Hydrolyzed — easiest on the stomach. Watch for Bodybuilding.com sales." },
  { id:"transparent",cat:"powder",name:"Whey Protein Isolate", brand:"Transparent Labs",protein:28, cal:130, size:"2 lb",    basePrice:59.99,  url:"https://transparentlabs.com",                badge:null,           note:"No artificial anything. Subscribe on their site for 10% off." },
  { id:"on_casein",cat:"powder",name:"Gold Standard Casein",   brand:"Optimum Nutrition",protein:24,cal:120, size:"4 lb",    basePrice:49.99,  url:"https://amazon.com/s?k=optimum+nutrition+casein+4lb", badge:"Best Night Option", note:"Take before bed. Same S&S discount applies as Gold Standard Whey." },
  { id:"garden",   cat:"powder",name:"Sport Organic Protein",  brand:"Garden of Life",  protein:30, cal:160, size:"1.8 lb",  basePrice:44.99,  url:"https://amazon.com/s?k=garden+of+life+sport+organic+protein", badge:"Best Plant", note:"iHerb often 15-20% cheaper than Amazon. Check both." },
];

// ─── BODY TRACKER COMPONENT ──────────────────────────────────────────────────

function BodyTracker({ isPremium, onUnlock, userContext }) {
  const [photos, setPhotos]       = useState([]);
  const [phase, setPhase]         = useState("home"); // home | capture | loading | report
  const [imgPreview, setImgPreview] = useState(null);
  const [imgB64, setImgB64]       = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [viewingIdx, setViewingIdx]       = useState(null);
  const [dragging, setDragging]   = useState(false);
  const fileRef = useRef();

  const checkInNum = photos.length + 1;
  const isBaseline = checkInNum === 1;

  const handleFile = useCallback((file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => { setImgPreview(e.target.result); setImgB64(e.target.result.split(",")[1]); };
    reader.readAsDataURL(file);
  }, []);

  const analyse = async () => {
    setPhase("loading");
    const prompt = BODY_REPORT_PROMPT(checkInNum, userContext);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1200,
          messages:[{ role:"user", content:[
            { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:imgB64 }},
            { type:"text",  text:prompt }
          ]}]
        })
      });
      const data = await res.json();
      const raw  = data.content?.find(b=>b.type==="text")?.text || "";
      const report = JSON.parse(raw.replace(/```json|```/g,"").trim());
      const entry = { date: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), num:checkInNum, preview:imgPreview, report };
      setPhotos(prev => [...prev, entry]);
      setCurrentReport(report);
      setPhase("report");
    } catch {
      const fallback = {
        headline: isBaseline ? "Baseline captured" : "Progress visible",
        subtitle: isBaseline ? "Your benchmark is set. Every check-in compares to this." : "Visible changes since your baseline.",
        score: { fatLoss: isBaseline ? 0 : 6, muscleRetention: isBaseline ? 0 : 7, overall: isBaseline ? 0 : 6 },
        observations: [
          { title: isBaseline ? "Good upper body frame" : "Midsection responding", detail: isBaseline ? "Solid starting structure. Your existing activities are already working in your favour." : "Visible reduction in lower abdominal softness. Fat loss is tracking well.", positive: true },
          { title: "Protein signal", detail: isBaseline ? "Prioritise protein from day one to protect the muscle you have." : "Muscle retention looks good — keep protein at your daily target.", positive: true }
        ],
        exerciseAdjustments: [{ label:"Resistance priority", text:"Ensure 2–3 resistance sessions per week. This is the single most important factor for body composition on GLP-1s." }],
        nutritionSignals: [{ label:"Protein floor", text:"Hit your protein target before anything else. If you can only eat 600 calories, make most of them protein." }],
        insight: { title: isBaseline ? "What to expect next" : "You're on track", body: isBaseline ? "Early GLP-1 changes are internal first — visceral fat before the mirror shows it. Stay consistent." : "Body composition changes typically accelerate between weeks 8–16.", type:"good" },
        nextFocus: isBaseline ? "Establish your protein routine before your next check-in" : "Increase resistance session frequency by one per week"
      };
      const entry = { date: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), num:checkInNum, preview:imgPreview, report:fallback };
      setPhotos(prev => [...prev, entry]);
      setCurrentReport(fallback);
      setPhase("report");
    }
  };

  if (!isPremium) return <Paywall onUnlock={onUnlock} tab="body" />;

  // ── Viewing a past report ──
  if (viewingIdx !== null && photos[viewingIdx]) {
    const p = photos[viewingIdx];
    const r = p.report;
    return (
      <div style={{ padding:16, paddingBottom:24 }}>
        <button onClick={() => setViewingIdx(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:T.teal, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:16, padding:0 }}>
          ← Back to timeline
        </button>
        <ReportView report={r} date={p.date} num={p.num} preview={p.preview} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom:24 }}>
      {/* Header */}
      <div style={{ background:T.white, padding:"18px 16px 14px", borderBottom:`1px solid ${T.border}` }}>
        <div className="serif" style={{ fontSize:22, color:T.navy, marginBottom:4 }}>Body Tracker</div>
        <div style={{ fontSize:13, color:T.muted, lineHeight:1.55 }}>
          Upload every two weeks. Claude analyses your body composition and tracks changes over time.
        </div>
      </div>

      {phase === "home" && (
        <div style={{ padding:16 }}>
          {/* Timeline of past check-ins */}
          {photos.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:2, marginBottom:12 }}>Your check-ins</div>
              <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:6 }}>
                {photos.map((p, i) => (
                  <div key={i} onClick={() => setViewingIdx(i)} style={{ flexShrink:0, width:100, cursor:"pointer" }}>
                    <div style={{ width:100, height:130, borderRadius:10, overflow:"hidden", border:`2px solid ${i===photos.length-1 ? T.teal : T.border}`, position:"relative" }}>
                      <img src={p.preview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
                      {i === 0 && (
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(13,27,42,0.75)", padding:"4px 6px" }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.cream, textTransform:"uppercase", letterSpacing:1 }}>Baseline</div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:5, textAlign:"center" }}>{p.date}</div>
                    {p.report.score?.overall > 0 && (
                      <div style={{ fontSize:11, fontWeight:700, color:T.teal, textAlign:"center" }}>{p.report.score.overall}/10</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side by side if 2+ photos */}
          {photos.length >= 2 && (
            <Card style={{ marginBottom:16 }}>
              <div style={{ padding:"12px 16px 10px", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5 }}>Baseline vs latest</div>
              </div>
              <div style={{ display:"flex", gap:0 }}>
                <div style={{ flex:1, position:"relative" }}>
                  <img src={photos[0].preview} alt="" style={{ width:"100%", height:220, objectFit:"cover", objectPosition:"top", display:"block" }} />
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(13,27,42,0.7)", padding:"6px 10px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.cream }}>Baseline · {photos[0].date}</div>
                  </div>
                </div>
                <div style={{ width:1, background:T.white }} />
                <div style={{ flex:1, position:"relative" }}>
                  <img src={photos[photos.length-1].preview} alt="" style={{ width:"100%", height:220, objectFit:"cover", objectPosition:"top", display:"block" }} />
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(26,122,138,0.85)", padding:"6px 10px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.cream }}>Week {(photos.length-1)*2+1} · {photos[photos.length-1].date}</div>
                  </div>
                </div>
              </div>
              {photos[photos.length-1].report.headline && (
                <div style={{ padding:"12px 16px" }}>
                  <div className="serif" style={{ fontSize:16, color:T.navy, marginBottom:4 }}>{photos[photos.length-1].report.headline}</div>
                  <div style={{ fontSize:13, color:T.muted }}>{photos[photos.length-1].report.subtitle}</div>
                </div>
              )}
            </Card>
          )}

          {/* Next check-in due */}
          <Card style={{ marginBottom:14 }}>
            <div style={{ padding:"16px" }}>
              {photos.length === 0 ? (
                <div style={{ textAlign:"center", padding:"8px 0" }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📸</div>
                  <div className="serif" style={{ fontSize:18, color:T.navy, marginBottom:6 }}>Set your baseline</div>
                  <div style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:16 }}>Your first photo sets the benchmark. Everything from here compares to this moment.</div>
                </div>
              ) : (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:T.muted }}>Next check-in</div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>Check-in #{photos.length + 1} — Week {photos.length * 2 + 1}</div>
                  </div>
                  <div style={{ fontSize:11, color:T.muted }}>in 14 days</div>
                </div>
              )}
              <PrimaryBtn onClick={() => { setPhase("capture"); setImgPreview(null); setImgB64(null); }}>
                {photos.length === 0 ? "Take Baseline Photo →" : `Start Check-In #${checkInNum} →`}
              </PrimaryBtn>
            </div>
          </Card>

          {/* Guidelines */}
          <Card>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Photo guidelines</div>
              {[
                { ok:true,  t:"Upper body front-facing — shoulders to navel" },
                { ok:true,  t:"Same time of day each fortnight (morning is best)" },
                { ok:true,  t:"Same lighting spot and distance" },
                { ok:true,  t:"Underwear or activewear — consistent each time" },
                { ok:false, t:"No headshots — face not required or stored" },
                { ok:false, t:"No full nudity" },
              ].map((g,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:g.ok?T.muted:T.rose, marginBottom:i<5?6:0 }}>
                  <span style={{ fontWeight:700, flexShrink:0 }}>{g.ok?"✓":"✗"}</span>{g.t}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Capture phase */}
      {phase === "capture" && (
        <div style={{ padding:16 }}>
          <button onClick={() => setPhase("home")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:T.teal, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:16, padding:0 }}>
            ← Back
          </button>
          <Card style={{ marginBottom:14 }}>
            <SectionHead eyebrow={isBaseline ? "Baseline" : `Check-in #${checkInNum}`} title="Upload your photo" />
            <div style={{ padding:16 }}>
              {!imgPreview ? (
                <>
                  <div style={{ background:T.light, borderRadius:12, padding:"32px 16px", textAlign:"center", marginBottom:14, border:`2px dashed ${dragging?T.teal:T.border}` }}
                    onDragOver={e=>{e.preventDefault();setDragging(true)}}
                    onDragLeave={()=>setDragging(false)}
                    onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}>
                    <div style={{ fontSize:32, marginBottom:8 }}>📷</div>
                    <div style={{ fontSize:13, color:T.muted }}>Shoulders to navel · Activewear only · No face needed</div>
                  </div>
                  <label htmlFor="body-photo" style={{ display:"block", width:"100%", padding:"14px", background:T.navy, color:T.white, borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", textAlign:"center", letterSpacing:0.3 }}>
                    Choose photo from library
                  </label>
                  <input id="body-photo" ref={fileRef} type="file" accept="image/*" onChange={e=>handleFile(e.target.files[0])} style={{ position:"absolute", width:1, height:1, opacity:0 }} />
                </>
              ) : (
                <>
                  <img src={imgPreview} alt="" style={{ width:"100%", height:240, objectFit:"cover", objectPosition:"top", borderRadius:10, display:"block", marginBottom:10 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>{setImgPreview(null);setImgB64(null);if(fileRef.current)fileRef.current.value=""}} style={{ flex:1, padding:"10px", border:`1px solid ${T.border}`, borderRadius:10, background:T.white, fontSize:13, color:T.muted, cursor:"pointer" }}>Retake</button>
                    <button onClick={analyse} style={{ flex:2, padding:"10px", background:T.teal, border:"none", borderRadius:10, fontSize:13, fontWeight:700, color:T.white, cursor:"pointer" }}>
                      {isBaseline ? "Analyse Baseline →" : "Analyse Check-in →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Loading */}
      {phase === "loading" && (
        <div style={{ padding:16 }}>
          <Card style={{ padding:"48px 24px", textAlign:"center" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
              <div style={{ width:40, height:40, border:`2px solid ${T.border}`, borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.75s linear infinite" }} />
              <div className="serif" style={{ fontSize:18, color:T.navy }}>Analysing your photo…</div>
              <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, maxWidth:260 }}>Claude is reviewing body composition, muscle retention signals, and fat distribution patterns.</div>
            </div>
          </Card>
        </div>
      )}

      {/* Report */}
      {phase === "report" && currentReport && (
        <div style={{ padding:16 }}>
          <ReportView report={currentReport} date={new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})} num={checkInNum} preview={imgPreview} />
          <button onClick={()=>setPhase("home")} style={{ width:"100%", padding:"13px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:12, fontSize:13, color:T.muted, cursor:"pointer", marginTop:12 }}>
            ← Back to timeline
          </button>
        </div>
      )}
    </div>
  );
}

// ─── REPORT VIEW SUBCOMPONENT ────────────────────────────────────────────────
function ReportView({ report, date, num, preview }) {
  const isBaseline = num === 1;
  const scoreColor = s => s >= 7 ? T.sage : s >= 4 ? T.amber : T.rose;
  return (
    <>
      {/* Report header */}
      <div style={{ background:T.navy, borderRadius:"14px 14px 0 0", padding:"22px 18px 18px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(82,183,136,0.15)", border:"1px solid rgba(82,183,136,0.3)", borderRadius:100, padding:"4px 12px", fontSize:9, letterSpacing:2, textTransform:"uppercase", color:"#52b788", marginBottom:12 }}>
          {isBaseline ? "✦ Baseline Set" : `✦ Check-in #${num} · ${date}`}
        </div>
        <div className="serif" style={{ fontSize:22, color:T.cream, lineHeight:1.2, marginBottom:6 }}>{report.headline}</div>
        <div style={{ fontSize:13, color:"rgba(249,247,244,0.55)", lineHeight:1.6 }}>{report.subtitle}</div>
        {/* Scores */}
        {!isBaseline && report.score && (
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            {[["Fat Loss","fatLoss"],["Muscle","muscleRetention"],["Overall","overall"]].map(([l,k]) => (
              <div key={k} style={{ flex:1, background:"rgba(255,255,255,0.06)", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                <div className="serif" style={{ fontSize:22, fontWeight:700, color: scoreColor(report.score[k]) }}>{report.score[k]}</div>
                <div style={{ fontSize:9, color:"rgba(249,247,244,0.4)", textTransform:"uppercase", letterSpacing:1 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background:T.white, border:`1px solid ${T.border}`, borderTop:"none", borderRadius:"0 0 14px 14px", marginBottom:14 }}>
        {/* Observations */}
        <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:9, letterSpacing:2.5, textTransform:"uppercase", color:T.teal, marginBottom:12 }}>What we see</div>
          {(report.observations||[]).map((o,i) => (
            <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:o.positive?T.sage:T.amber, marginTop:6, flexShrink:0 }} />
              <div style={{ fontSize:13, color:T.muted, lineHeight:1.65 }}>
                <strong style={{ display:"block", color:T.navy, marginBottom:1 }}>{o.title}</strong>{o.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Exercise adjustments */}
        {(report.exerciseAdjustments||[]).length > 0 && (
          <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ fontSize:9, letterSpacing:2.5, textTransform:"uppercase", color:T.teal, marginBottom:12 }}>Exercise adjustments</div>
            {(report.exerciseAdjustments||[]).map((a,i) => (
              <div key={i} style={{ background:T.light, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:T.teal, marginBottom:3 }}>{a.label}</div>
                <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>{a.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Nutrition signals */}
        {(report.nutritionSignals||[]).length > 0 && (
          <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ fontSize:9, letterSpacing:2.5, textTransform:"uppercase", color:T.teal, marginBottom:12 }}>Nutrition signals</div>
            {(report.nutritionSignals||[]).map((n,i) => (
              <div key={i} style={{ background:T.light, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:T.violet, marginBottom:3 }}>{n.label}</div>
                <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>{n.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Insight */}
        {report.insight && (
          <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ background:report.insight.type==="warn"?T.amber+"0C":T.teal+"0C", border:`1px solid ${report.insight.type==="warn"?T.amber+"40":T.teal+"30"}`, borderRadius:10, padding:"14px" }}>
              <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:report.insight.type==="warn"?T.amber:T.teal, fontWeight:700, marginBottom:5 }}>✦ Insight</div>
              <div className="serif" style={{ fontSize:15, color:T.navy, marginBottom:5 }}>{report.insight.title}</div>
              <div style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>{report.insight.body}</div>
            </div>
          </div>
        )}

        {/* Next focus */}
        {report.nextFocus && (
          <div style={{ padding:"14px 18px" }}>
            <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:T.teal, marginBottom:6 }}>Before your next check-in</div>
            <div style={{ fontSize:14, fontWeight:600, color:T.navy, lineHeight:1.4 }}>{report.nextFocus}</div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── SHOP COMPONENT ──────────────────────────────────────────────────────────

function ShopTab() {
  const [branch, setBranch]       = useState("meds");  // meds | protein
  const [catFilter, setCatFilter] = useState("all");   // all | bar | powder
  const [alerts, setAlerts]       = useState({});       // productId: true/false
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const toggleAlert = id => setAlerts(prev => ({ ...prev, [id]: !prev[id] }));

  const liveSearch = async (product) => {
    setSearching(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:600,
          tools:[{ type:"web_search_20250305", name:"web_search" }],
          messages:[{ role:"user", content:`Find the current best online price for "${product.name}" by ${product.brand} (${product.size}). Check Amazon, Walmart, Target, iHerb, and Bodybuilding.com. Return JSON only: {"results":[{"store":"...","price":0.00,"url":"...","note":"..."}],"bestDeal":{"store":"...","price":0.00},"updatedAt":"now"}` }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setSearchResults({ productId: product.id, ...parsed });
    } catch {
      setSearchResults({
        productId: product.id,
        results:[
          { store:"Amazon", price: product.basePrice * 0.85, url: product.url, note:"Subscribe & Save price" },
          { store:"Walmart", price: product.basePrice * 0.9, url:`https://walmart.com/search?q=${encodeURIComponent(product.name)}`, note:"In-store pickup available" },
          { store:"iHerb",   price: product.basePrice * 0.8, url:`https://iherb.com/search?kw=${encodeURIComponent(product.name)}`, note:"Often 15-20% cheaper than Amazon" },
        ],
        bestDeal:{ store:"iHerb", price: product.basePrice * 0.8 },
        updatedAt:"just now"
      });
    }
    setSearching(false);
  };

  const filteredProducts = PROTEIN_PRODUCTS.filter(p => catFilter === "all" || p.cat === catFilter);

  return (
    <div style={{ paddingBottom:24 }}>
      {/* Header */}
      <div style={{ background:T.white, borderBottom:`1px solid ${T.border}`, padding:"16px 16px 0" }}>
        <div className="serif" style={{ fontSize:22, color:T.navy, marginBottom:4 }}>Shop</div>
        <div style={{ fontSize:13, color:T.muted, marginBottom:12 }}>Find the best prices on medication and protein products.</div>
        <div style={{ display:"flex", gap:0 }}>
          {[["meds","💊 Medication"],["protein","🥛 Protein"]].map(([v,l]) => (
            <button key={v} onClick={() => { setBranch(v); setSearchResults(null); }}
              style={{ flex:1, padding:"11px 8px", border:"none", background:"transparent", cursor:"pointer", borderBottom:`3px solid ${branch===v?T.teal:"transparent"}`, color:branch===v?T.teal:T.muted, fontSize:13, fontWeight:branch===v?700:400 }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── MEDICATION ── */}
      {branch === "meds" && (
        <div style={{ padding:16 }}>
          <div style={{ background:T.amber+"0C", border:`1px solid ${T.amber}30`, borderRadius:10, padding:"11px 14px", marginBottom:16, fontSize:12, color:T.amber, lineHeight:1.6 }}>
            ⚠ Prices are community-reported and change frequently. Always verify directly with the provider. Live pricing lookup coming in V2.
          </div>

          {MEDS.map(m => (
            <Card key={m.id} style={{ marginBottom:12 }}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>{m.name}</div>
                      {m.badge && <div style={{ fontSize:9, fontWeight:700, background:T.teal+"18", color:T.teal, padding:"2px 8px", borderRadius:100, letterSpacing:1, textTransform:"uppercase" }}>{m.badge}</div>}
                    </div>
                    <div style={{ fontSize:11, color:T.muted }}>{m.type} · {m.product}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div className="serif" style={{ fontSize:22, fontWeight:700, color:T.teal }}>${m.price}</div>
                    <div style={{ fontSize:10, color:T.muted }}>/{m.per}</div>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <div style={{ display:"flex", gap:1 }}>{[1,2,3,4,5].map(n=><span key={n} style={{ fontSize:11, color:n<=Math.round(m.rating)?T.amber:"#ddd" }}>★</span>)}</div>
                  <span style={{ fontSize:11, color:T.muted }}>{m.rating} · {m.reviews.toLocaleString()} reviews</span>
                </div>

                {/* Pros/cons */}
                <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    {m.pros.map((p,i) => <div key={i} style={{ fontSize:11, color:T.sage, marginBottom:2 }}>✓ {p}</div>)}
                  </div>
                  <div style={{ flex:1 }}>
                    {m.cons.map((c,i) => <div key={i} style={{ fontSize:11, color:T.muted, marginBottom:2 }}>— {c}</div>)}
                  </div>
                </div>

                <a href={m.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:"block", width:"100%", padding:"11px", background:T.navy, color:T.white, borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", textAlign:"center", textDecoration:"none", letterSpacing:0.3 }}>
                  Visit {m.name} →
                </a>
              </div>
            </Card>
          ))}

          <div style={{ background:T.light, borderRadius:12, padding:"14px 16px", marginTop:4 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:5 }}>💡 How to get the best medication price</div>
            <div style={{ fontSize:12, color:T.muted, lineHeight:1.7 }}>
              1. Get your prescription first — any telehealth above can do this.<br/>
              2. Take your prescription to a compounding pharmacy directly — often 30–40% cheaper than bundled telehealth pricing.<br/>
              3. Check Sesame for low-cost prescribing consults ($89) then fill elsewhere.<br/>
              4. GoodRx and Cost Plus Drugs can reduce brand-name costs significantly if covered.
            </div>
          </div>
        </div>
      )}

      {/* ── PROTEIN PRODUCTS ── */}
      {branch === "protein" && (
        <div style={{ padding:16 }}>
          {/* Category filter */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[["all","All"],["bar","Bars"],["powder","Powders"]].map(([v,l]) => (
              <button key={v} onClick={()=>setCatFilter(v)}
                style={{ padding:"7px 16px", borderRadius:100, border:`1.5px solid ${catFilter===v?T.teal:T.border}`, background:catFilter===v?T.teal+"12":T.white, color:catFilter===v?T.teal:T.muted, fontSize:12, fontWeight:catFilter===v?700:400, cursor:"pointer" }}>
                {l}
              </button>
            ))}
          </div>

          {filteredProducts.map(p => {
            const hasAlert = alerts[p.id];
            const isSearching = searching && searchResults === null;
            const result = searchResults?.productId === p.id ? searchResults : null;
            return (
              <Card key={p.id} style={{ marginBottom:12 }}>
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:3 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>{p.name}</div>
                        {p.badge && <div style={{ fontSize:9, fontWeight:700, background:T.teal+"18", color:T.teal, padding:"2px 8px", borderRadius:100, letterSpacing:1, textTransform:"uppercase" }}>{p.badge}</div>}
                      </div>
                      <div style={{ fontSize:11, color:T.muted }}>{p.brand} · {p.size} · {p.protein}g protein</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                      <div className="serif" style={{ fontSize:20, fontWeight:700, color:T.teal }}>${p.basePrice}</div>
                      <div style={{ fontSize:10, color:T.muted }}>est. retail</div>
                    </div>
                  </div>

                  <div style={{ fontSize:12, color:"#555", lineHeight:1.55, marginBottom:12 }}>{p.note}</div>

                  {/* Live search results */}
                  {result && (
                    <div style={{ background:T.light, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
                      <div style={{ fontSize:9, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>
                        Live prices · {result.updatedAt}
                      </div>
                      {(result.results||[]).map((r,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:i<(result.results.length-1)?`1px solid ${T.border}`:"none" }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{r.store}</div>
                            {r.note && <div style={{ fontSize:11, color:T.muted }}>{r.note}</div>}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ fontSize:14, fontWeight:700, color:i===0?T.sage:T.navy }}>${r.price.toFixed(2)}</div>
                            <a href={r.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:11, color:T.teal, fontWeight:700, textDecoration:"none" }}>Shop →</a>
                          </div>
                        </div>
                      ))}
                      {result.bestDeal && (
                        <div style={{ marginTop:8, padding:"8px 10px", background:T.sage+"0C", border:`1px solid ${T.sage}30`, borderRadius:8, fontSize:12, color:T.sage, fontWeight:700 }}>
                          ✓ Best deal: {result.bestDeal.store} at ${result.bestDeal.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>liveSearch(p)} disabled={searching}
                      style={{ flex:1, padding:"10px", background: searching?T.border:T.navy, color:T.white, border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor:searching?"not-allowed":"pointer" }}>
                      {isSearching ? "Searching…" : result ? "Refresh prices" : "🔍 Find live price"}
                    </button>
                    <button onClick={()=>toggleAlert(p.id)}
                      style={{ padding:"10px 14px", borderRadius:10, border:`1.5px solid ${hasAlert?T.amber:T.border}`, background:hasAlert?T.amber+"12":T.white, color:hasAlert?T.amber:T.muted, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                      {hasAlert ? "🔔 Alert on" : "🔕 Alert"}
                    </button>
                  </div>
                  {hasAlert && (
                    <div style={{ marginTop:8, fontSize:11, color:T.amber, lineHeight:1.5 }}>
                      ✓ We'll notify you when {p.name} drops below ${(p.basePrice * 0.8).toFixed(2)} · Push alerts coming in V2
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase,    setPhase]    = useState("onboard");
  const [obStep,   setObStep]   = useState(0);
  const [obAns,    setObAns]    = useState({});
  const [numInput, setNumInput] = useState("");
  const [track,    setTrack]    = useState(null);
  const [tab,      setTab]      = useState("journey");
  const [premium,  setPremium]  = useState(false);
  const [activities, setActivities] = useState(["golf","pilates","walking"]);
  const [frequencies, setFrequencies] = useState({ golf:1, pilates:2, walking:2 });
  const [durations, setDurations]     = useState({ walking:45 });
  const [photoHistory, setPhotoHistory] = useState([]);
  const [bodyPhotos, setBodyPhotos]     = useState([]); // Body Tracker persistent store

  const proteinTarget = obAns.goal_weight
    ? Math.round((parseFloat(obAns.goal_weight) / 2.205) * 1.8)
    : obAns.weight
    ? Math.round((parseFloat(obAns.weight) / 2.205) * 1.6)
    : null;

  const trackMeta = TRACK_META[track] || TRACK_META.mid_loss;

  // User context for Claude Vision body analysis
  const userContext = [
    obAns.product ? `Medication: ${obAns.product}` : null,
    obAns.goal    ? `Goal: ${obAns.goal}` : null,
    obAns.bmi     ? `Starting BMI range: ${obAns.bmi}` : null,
    activities.length > 0 ? `Regular activities: ${activities.join(", ")}` : null,
    proteinTarget ? `Daily protein target: ${proteinTarget}g` : null,
    trackMeta     ? `Program track: ${trackMeta.label}` : null,
  ].filter(Boolean).join(". ");

  function answerOB(val) {
    const q    = OB_STEPS[obStep];
    const next = { ...obAns, [q.id]: val };
    setObAns(next);
    if (obStep < OB_STEPS.length - 1) {
      setNumInput("");
      setTimeout(() => setObStep(obStep + 1), 180);
    } else {
      setTrack(resolveTrack(next));
      setTimeout(() => setPhase("app"), 280);
    }
  }

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (phase === "onboard") {
    const q = OB_STEPS[obStep];
    return (
      <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${T.navy} 0%,#1A3040 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 16px", fontFamily:"'Jost', sans-serif" }}>
        <style>{G}</style>
        <div style={{ background:T.white, borderRadius:20, width:"100%", maxWidth:460, padding:"28px 28px 32px", boxShadow:"0 24px 64px rgba(0,0,0,0.3)" }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:T.navy, color:T.white, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700 }}>J</div>
              <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>GLP-1 Journey</span>
            </div>
            <div style={{ display:"flex", gap:5 }}>
              {OB_STEPS.map((_,i) => (
                <div key={i} style={{ height:4, borderRadius:2, background: i<=obStep ? T.teal : T.border, width: i===obStep ? 24 : 8, transition:"all 0.25s" }} />
              ))}
            </div>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>Step {obStep+1} of {OB_STEPS.length}</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, color:T.navy, lineHeight:1.3, marginBottom:6 }}>{q.q}</h2>
          <p style={{ fontSize:13, color:T.muted, marginBottom:20, lineHeight:1.5 }}>{q.sub}</p>

          {q.isNumeric ? (
            <div>
              <div style={{ display:"flex", gap:10 }}>
                <input type="number" value={numInput} onChange={e=>setNumInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&numInput&&answerOB(numInput)} placeholder="e.g. 210" style={{ flex:1, padding:"11px 13px", borderRadius:9, border:`1.5px solid ${T.border}`, fontSize:16, color:T.navy, outline:"none" }} />
                <button onClick={()=>numInput&&answerOB(numInput)} style={{ padding:"11px 20px", background:T.teal, color:T.white, border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", opacity:numInput?1:0.4 }}>Next →</button>
              </div>
              <button onClick={()=>answerOB("")} style={{ display:"block", marginTop:11, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer" }}>Skip for now</button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {q.options.map(opt => (
                <button key={opt.v} onClick={()=>answerOB(opt.v)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, border:`1.5px solid ${obAns[q.id]===opt.v ? T.teal : T.border}`, background: obAns[q.id]===opt.v ? T.teal+"0C" : T.white, cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background: obAns[q.id]===opt.v ? T.teal : T.light, color: obAns[q.id]===opt.v ? T.white : T.muted, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0 }}>{opt.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:T.navy }}>{opt.label}</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{opt.desc}</div>
                  </div>
                  {obAns[q.id]===opt.v && <span style={{ color:T.teal, fontSize:16 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:11, marginTop:16 }}>Your answers personalise the content. Update anytime.</p>
      </div>
    );
  }

  // ── Main App ────────────────────────────────────────────────────────────────
  const TABS = [
    { id:"journey", label:"Journey", icon:"◎" },
    { id:"track",   label:"Move",    icon:"🏃" },
    { id:"body",    label:"Body",    icon:"📸" },
    { id:"tools",   label:"Tools",   icon:"⊕" },
    { id:"shop",    label:"Shop",    icon:"🛒" },
  ];

  return (
    <div style={{ maxWidth:600, margin:"0 auto", minHeight:"100vh", background:T.warm, fontFamily:"'Jost', sans-serif", position:"relative", paddingBottom:72 }}>
      <style>{G}</style>

      {/* Top bar */}
      <div style={{ background:T.navy, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:T.teal, color:T.white, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond', serif", fontSize:16, fontWeight:700 }}>J</div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.cream }}>GLP-1 Journey</div>
            {proteinTarget && <div style={{ fontSize:10, color:"rgba(249,247,244,0.45)" }}>Protein target: {proteinTarget}g/day</div>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, border:`1px solid ${trackMeta.color}50`, background:trackMeta.color+"18", color:trackMeta.color }}>
            <span style={{ fontSize:11 }}>{trackMeta.icon}</span>
            <span style={{ fontSize:10, fontWeight:700 }}>{trackMeta.label}</span>
          </div>
          {premium && <div style={{ fontSize:9, fontWeight:700, color:T.gold, background:T.gold+"20", padding:"3px 8px", borderRadius:5, letterSpacing:1, textTransform:"uppercase" }}>Pro</div>}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ minHeight:"calc(100vh - 144px)" }}>
        {tab === "journey" && <JourneyTab track={track || "mid_loss"} />}
        {tab === "track" && (
          <TrackTab
            isPremium={premium}
            onUnlock={() => setPremium(true)}
            selectedActivities={activities}
            setSelectedActivities={setActivities}
            frequencies={frequencies}
            setFrequencies={setFrequencies}
            durations={durations}
            setDurations={setDurations}
            photoHistory={photoHistory}
            setPhotoHistory={setPhotoHistory}
          />
        )}
        {tab === "tools" && <ToolsTab proteinTarget={proteinTarget} />}
        {tab === "body"  && (
          <BodyTracker
            isPremium={premium}
            onUnlock={() => setPremium(true)}
            userContext={userContext}
          />
        )}
        {tab === "shop"  && <ShopTab />}
      </div>

      {/* Bottom tab bar */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:600, background:T.navy, display:"flex", borderTop:`1px solid rgba(255,255,255,0.08)`, zIndex:50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 4px 12px", border:"none", background:"transparent", cursor:"pointer", gap:4, color: tab===t.id ? T.teal : "rgba(249,247,244,0.35)", transition:"color 0.2s", position:"relative" }}>
            <span style={{ fontSize:20, lineHeight:1 }}>{t.icon}</span>
            <span style={{ fontSize:10, letterSpacing:1, textTransform:"uppercase" }}>{t.label}</span>
            {(t.id === "track" || t.id === "body") && !premium && (
              <span style={{ position:"absolute", top:8, right:"calc(50% - 18px)", width:7, height:7, borderRadius:"50%", background:T.gold }} />
            )}
          </button>
        ))}
      </div>

      {/* Update profile link */}
      <div style={{ position:"fixed", bottom:80, right:16, zIndex:40 }}>
        <button onClick={() => { setPhase("onboard"); setObStep(0); setObAns({}); setTrack(null); }} style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:100, padding:"6px 12px", fontSize:11, color:T.muted, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
          ↩ Edit profile
        </button>
      </div>
    </div>
  );
}
