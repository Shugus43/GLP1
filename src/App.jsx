import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────
const T = {
  navy:    "#0D1B2A",
  teal:    "#1A7A8A",
  sage:    "#3D7A6A",
  amber:   "#C97B2E",
  rose:    "#A84848",
  violet:  "#5A4E9A",
  cream:   "#F9F7F4",
  warm:    "#F2EDE6",
  white:   "#FFFFFF",
  border:  "#E2DDD6",
  muted:   "#7A7068",
  text:    "#1A1410",
  light:   "#F4F1EC",
};

const TRACK_META = {
  high_loss:  { label: "High BMI · Weight Loss",       color: T.teal,   icon: "◈", short: "High BMI" },
  mid_loss:   { label: "Moderate BMI · Weight Loss",   color: T.sage,   icon: "◇", short: "Mod. BMI" },
  mid_recomp: { label: "Moderate BMI · Recomposition", color: T.violet, icon: "◆", short: "Recomp" },
  low_recomp: { label: "Lower BMI · Performance",      color: T.amber,  icon: "◉", short: "Performance" },
  metabolic:  { label: "Metabolic Health",              color: T.rose,   icon: "◎", short: "Metabolic" },
};

function resolveTrack(a) {
  if (a.goal === "metabolic") return "metabolic";
  if (a.bmi === "high") return "high_loss";
  if (a.bmi === "low") return "low_recomp";
  if (a.goal === "recomp" || a.goal === "performance") return "mid_recomp";
  return "mid_loss";
}

function today() { return new Date().toISOString().split("T")[0]; }
function nowTime() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

// ─── FULL CONTENT DATABASE ────────────────────────────────
// Universal content + track-specific content merged by stage

const CONTENT = {
  pre: {
    week: "Pre-Start", label: "Before You Begin", icon: "①",
    color: T.violet,
    tagline: "Everything you need to know before your first dose",
    universal: [
      {
        title: "Understanding the Medication",
        questions: [
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
        questions: [
          { q: "What do I need at home before starting?", a: "Electrolyte supplements (nausea and reduced intake deplete sodium, potassium, magnesium). Protein shakes for days when solid food is unappealing. Ginger in any form for nausea. A food scale. A way to track protein — not for restriction but to ensure you're hitting targets when appetite is suppressed. Anti-nausea medication discussed with your prescriber in advance." },
          { q: "Should I change my diet or start exercising before I begin?", a: "Two weeks before your first injection: begin reducing meal portion sizes and fat content — high-fat, high-volume meals dramatically worsen nausea when gastric emptying slows. Start or re-establish a resistance training routine before appetite suppression arrives. Muscle built before starting is muscle you'll be fighting to preserve during a caloric deficit." },
          { q: "What day and time should I inject?", a: "Mid-week injection (Wednesday or Thursday) means your worst side effect window falls on the weekend. Friday injections reliably produce the worst Mondays. Injecting at night before sleep means peak plasma levels occur during sleep, significantly reducing daytime nausea for many people." },
        ]
      },
      {
        title: "Mental Preparation",
        questions: [
          { q: "Will this change my relationship with food?", a: "Almost certainly yes, and in ways that can be surprising. Food is not just fuel — it's pleasure, social connection, and habit. When GLP-1s change your neurological relationship with food, they can inadvertently disrupt social patterns you didn't realise were anchored to appetite. Many people describe grief alongside the relief — mourning the pleasure food used to bring even as they're grateful for the reduced compulsion." },
          { q: "What are realistic expectations for the first month?", a: "Set your scale expectations low and your discomfort expectations high. Most people feel the side effects before the results. The mental shift — reduced food noise, easier choices — often arrives before the scale moves significantly. That signal matters and is worth noting when it arrives." },
          { q: "I have a history of disordered eating. Is this safe for me?", a: "GLP-1s can interact in complex ways with eating disorder psychology. Extreme appetite suppression can enable restrictive patterns. The absence of hunger can disconnect people from normal interoceptive signals. This is not a categorical contraindication, but it is a strong reason to have psychological support alongside treatment and to be explicitly honest with your prescriber about your history before starting." },
        ]
      },
    ],
    byTrack: {
      high_loss: [{ title: "Starting at Higher Weight — What's Different", questions: [
        { q: "I've tried everything before. Why would this be different?", a: "GLP-1 therapy operates on a completely different mechanism. Every diet you've tried worked by changing what you ate — and triggered the same counter-regulatory biological response: increased hunger hormones, slowed metabolism, a body fighting to return to its defended weight. GLP-1 therapy intervenes upstream. It changes what your body neurologically requests, not just what you allow yourself. Response rates are largely independent of previous diet history." },
        { q: "Do I need a higher starting dose because of my weight?", a: "No — and this is a common misconception. Dose is determined by tolerability and GI adaptation, not body weight. Everyone starts at the same low starting dose regardless of size. Starting higher dramatically increases side effect severity and is one of the most reliable ways to have a miserable first month." },
        { q: "Will I lose muscle and have loose skin?", a: "Loose skin is a genuine consideration at higher starting weight. The main factors: rate of weight loss (slower is better for skin adaptation), age, genetics, and hydration. Resistance training helps — maintaining muscle volume beneath the skin improves appearance significantly. Most people report loose skin is far less distressing than anticipated — and far less distressing than the weight itself was." },
        { q: "I have other health conditions — diabetes, blood pressure, sleep apnea. How does that change things?", a: "If you have type 2 diabetes: glucose-lowering medications may need adjustment as glucose improves rapidly — discuss with your prescriber before starting. If you have hypertension: blood pressure often drops meaningfully with weight loss — antihypertensive medications may need downward adjustment within 4–8 weeks. If you have sleep apnea: weight loss significantly improves or resolves OSA — your CPAP settings may need recalibration." },
      ]}],
      mid_loss: [{ title: "Moderate Starting Weight — Expectations", questions: [
        { q: "Am I a good candidate for GLP-1 therapy at BMI 28–32?", a: "Yes — particularly with metabolic risk factors: elevated fasting glucose or HbA1c, high triglycerides, low HDL, elevated blood pressure, or family history of type 2 diabetes. FDA-approved indications include BMI 30+ with at least one weight-related comorbidity, or BMI 27+ with two or more. Experienced prescribers apply clinical judgment beyond BMI alone." },
        { q: "How much weight can I realistically expect to lose?", a: "At BMI 28–35: population averages on semaglutide are 10–14% of body weight over 12 months, tirzepatide 14–18%. On 90kg, that's 9–13kg on semaglutide and 13–16kg on tirzepatide. The variable that most separates upper from lower range outcomes is protein intake and resistance training — both within your control from day one." },
        { q: "Should I focus on scale weight or body composition?", a: "Body composition. Someone who loses 6kg of fat while gaining 1kg of muscle looks and functions dramatically better than someone who loses 8kg including 2.5kg of muscle. Measurements, progress photos, and tracking strength give a more accurate and motivating picture than the scale alone." },
      ]}],
      mid_recomp: [{ title: "Recomposition — A Different Protocol", questions: [
        { q: "I want to lose fat and build muscle. Is GLP-1 appropriate for this goal?", a: "Yes, but the protocol is meaningfully different. For recomposition, the goal is a modest deficit (300–400 calories below maintenance) combined with optimal protein and progressive resistance training. GLP-1 at a lower dose can reduce appetite noise without suppressing intake so aggressively that training performance is impaired. Be explicit with your prescriber that recomposition — not maximum weight loss — is your goal." },
        { q: "What dose strategy is appropriate for recomposition?", a: "Lower than standard weight loss doses for most people. Enough appetite modulation to reduce overeating while maintaining adequate intake for training and recovery. Many recomposition users find a stable lower dose serves them better than continued escalation. This requires a prescriber who understands your goal is body composition, not maximum weight loss." },
        { q: "How should I structure my nutrition differently for recomposition?", a: "You're eating more than a weight loss approach. Recomposition requires enough total calories to fuel training. Protein targets are higher — 1.8–2.2g per kg of bodyweight. Carbohydrates around training sessions are important for performance — don't restrict carbs as aggressively as a pure weight-loss approach. Eat protein first at every meal, fuel training with carbohydrates, and let the moderate caloric deficit handle fat loss gradually." },
      ]}],
      low_recomp: [{ title: "Lower BMI — Performance Considerations", questions: [
        { q: "I'm already lean. What are the specific risks I should understand?", a: "The ratio of muscle to fat loss becomes less favourable the leaner you are — there's less fat available, so a deficit draws proportionally more from lean tissue. This makes protein targets and resistance training even more critical. Hormonal disruption from significant caloric restriction is also a concern at lower body fat — track menstrual cycle changes if applicable and raise any irregularity with your prescriber." },
        { q: "What does a lower-dose protocol look like for body composition goals?", a: "Lower-dose use (sub-therapeutic range) for body composition is off-label and more nuanced than clinical weight management. The rationale: appetite modulation without full suppression, avoiding GI side effects that impair training. Ensure your prescriber understands your performance goals — not just clinical weight management — and is monitoring appropriately." },
        { q: "I train hard 5–6 days per week. How will this affect my training?", a: "High training volume requires high caloric throughput. Prioritize pre and intra-workout nutrition even when not hungry, consider reducing training volume (not intensity) in weeks 1–3 while adapting, and monitor recovery markers carefully — persistent soreness beyond 72 hours or declining performance signals inadequate recovery." },
      ]}],
      metabolic: [{ title: "Metabolic Health as the Primary Goal", questions: [
        { q: "My goal is improving glucose and cardiovascular risk, not weight loss. Does the approach change?", a: "Meaningfully yes. Metabolic health goals are often achieved at lower levels of weight loss than people expect — 5–10% of body weight produces significant improvements in insulin sensitivity, blood pressure, lipid profiles, and liver fat. You may reach your primary clinical goal well before reaching an aesthetic goal — that's a successful outcome. Success metric is your bloodwork, not your scale." },
        { q: "Will GLP-1 improve my glucose control even before I lose significant weight?", a: "Yes — this is one of the most clinically important distinctions. GLP-1 agonists improve glycaemic control through mechanisms independent of weight loss: they stimulate insulin secretion in a glucose-dependent manner, suppress glucagon release, and slow gastric emptying. Many people see HbA1c improvements within 4–8 weeks, before major weight loss has occurred." },
        { q: "What markers should I track to measure metabolic success?", a: "Fasting glucose and fasting insulin (calculate HOMA-IR for insulin resistance), HbA1c, triglycerides, HDL cholesterol, blood pressure, waist circumference, and liver enzymes. These are more meaningful than the scale for your specific goal. Repeat at 3 months minimum, ideally at 6–8 weeks for early response." },
      ]}],
    }
  },
  w1: {
    week: "Week 1", label: "First Dose", icon: "②",
    color: T.rose,
    tagline: "Your body is adapting — expect friction",
    universal: [
      { title: "What's Normal Right Now", questions: [
        { q: "The nausea is severe. Is this normal and what can I do?", a: "Yes — severe nausea in week one is common and doesn't mean a dangerous reaction. Management in order of effectiveness: inject at night so peak effect occurs during sleep. Cold or room-temperature foods only — heat amplifies nausea. Small volume meals rather than skipping entirely. Avoid high-fat foods completely. Ginger in any form helps. Stay hydrated with electrolytes. If vomiting and can't keep fluids down for more than 24 hours, contact your doctor — ondansetron is safe and effective alongside GLP-1s." },
        { q: "I've barely eaten anything. Am I eating too little?", a: "Week one appetite suppression can be dramatic. The concern is not eating less, it's the floor: aim for at least 800–1,000 calories minimum with protein as the priority. Even if that means only protein shakes, get the protein in. Repeated weeks without adequate protein will cause muscle loss." },
        { q: "I'm constipated — what do I do?", a: "Expected and nearly universal in week one. Increase water to 3L+ daily starting now, add magnesium glycinate 300–400mg tonight, begin a fibre supplement. Walk daily — even 20 minutes helps motility. If no bowel movement after 4 days, contact your doctor — osmotic laxatives (MiraLax) are safe alongside GLP-1s. Don't let constipation extend beyond 6 days." },
        { q: "I feel completely exhausted. Is this the medication?", a: "Yes, multi-factorial. Reduced caloric intake, physiological adjustment to changed hormone signalling, and direct medication effects all contribute. This week: rest, maintain minimum nutrition, stay hydrated. If fatigue is severe and accompanied by dizziness, contact your doctor — this can indicate dehydration or hypoglycaemia." },
        { q: "I have a headache that won't go away.", a: "Almost certainly dehydration and electrolyte depletion. Drink 500ml of electrolyte fluid now and another 500ml over the next two hours. Most GLP-1 headaches resolve within 30–60 minutes of adequate rehydration. If it persists beyond 48 hours or includes visual disturbance, seek medical attention." },
        { q: "I feel emotionally flat or low. Is that the medication?", a: "Possibly. Mood changes in week one are documented and more common than widely acknowledged. Reduced caloric intake affects neurotransmitter production. Most mood effects in week one resolve as the body adapts. If low mood is severe, persistent beyond two weeks, or worsening, discuss with your doctor — not something to dismiss." },
      ]},
      { title: "Practical Week 1 Questions", questions: [
        { q: "The scale hasn't moved at all. Is something wrong?", a: "Nothing is wrong. Week one scale movement is unreliable — inflammation, glycogen changes, water retention, and constipation can all mask early fat loss. The question to ask this week is not 'is the scale moving' but 'can I feel the appetite change' — that's the actual early indicator of response." },
        { q: "Can I exercise this week?", a: "Light to moderate movement — walking, gentle yoga, light resistance work — is fine and helpful for constipation and mood. Do not push intensity. High-intensity training in week one while undereating significantly increases injury risk. Goal this week: maintain the habit, not optimize performance." },
        { q: "My hunger came back by day 5 or 6. Is the medication wearing off?", a: "No. The pharmacokinetics of weekly GLP-1s mean plasma levels peak at 24–72 hours post-injection and then gradually decline. Feeling somewhat more hungry by days 5–7 is expected. This typically evens out over the first few weeks as steady-state levels build with each injection." },
      ]},
    ],
    byTrack: {
      high_loss: [{ title: "Week 1 at Higher BMI — What's Different", questions: [
        { q: "I've lost 4–6 pounds already. Is this real weight loss?", a: "Mostly water, glycogen depletion, and inflammation reduction — not fat. At higher starting weights, particularly with elevated insulin levels, the early scale drop can be dramatic and almost entirely fluid. Enjoy the early movement but calibrate ongoing expectations to 1–2 pounds per week from week 3 onward." },
        { q: "My joints feel worse this week. Is inflammation getting worse?", a: "Some people experience a temporary increase in joint discomfort in week one before significant improvement — likely related to fluid balance changes. It typically resolves within 2–3 weeks. The longer-term trajectory is strongly positive: even 5–10% weight loss produces measurable reductions in joint load and inflammatory markers." },
        { q: "I feel genuinely hopeful for the first time in years. Is it okay to feel this way?", a: "Yes — completely. The hope is real and the response to it is valid. Many people at higher BMI carry significant history of failed attempts. Feeling the appetite suppression work for the first time can produce genuine emotional relief. Hold onto that signal — and at the same time, protect it by not staking everything on week-one scale movement." },
      ]}],
      mid_loss: [{ title: "Week 1 — Moderate BMI Specific", questions: [
        { q: "My appetite has dropped dramatically. How do I know if I'm eating enough?", a: "Track it this week at least. Rough protein and calorie estimate from a food app tells you whether you're above the floor. Aim for 1,200 calories and 100–120g protein on difficult days. Most people at moderate BMI find week one produces 600–900 calorie days without effort — that's too low. Schedule three eating windows regardless of hunger. At each window, eat protein first." },
        { q: "I only have 25–30 pounds to lose. Will the side effects be worth it?", a: "Fair question. Side effects are worst in weeks 1–3 and become very manageable by week 4. The calculus: 3 difficult weeks followed by 6+ months of significantly easier appetite management versus continuing to manage 25–30 pounds through willpower alone. Most people who reach this question at week 1 answer it by week 4." },
        { q: "My insurance required prior authorization and I'm worried about losing coverage.", a: "Document your starting weight carefully and track weight consistently from week 1 — you'll need this data for renewal, which typically requires demonstrating 5% loss at 3 months. Novo Nordisk and Eli Lilly both have patient assistance programs that significantly reduce out-of-pocket costs if coverage lapses — ask your prescriber's office." },
      ]}],
      mid_recomp: [{ title: "Week 1 Recomposition — Getting the Foundation Right", questions: [
        { q: "The scale is dropping fast. Shouldn't I lean into the deficit?", a: "No — this is the most important recomposition principle to establish in week one. Aggressive deficit produces rapid scale movement that is predominantly water and glycogen, followed by accelerated muscle loss. For recomposition the scale dropping more than 1.5–2 pounds per week signals your deficit is too large. If the medication is suppressing appetite so aggressively you're below your target intake, eat more — even when not hungry." },
        { q: "I'm eating so little that hitting protein feels impossible. What's the priority?", a: "Protein — unambiguously for a recomposition goal. If you can only manage 800–1,000 calories today, make 150–180g protein. Protein preserves muscle under energy restriction and has the highest thermic effect of any macronutrient. Carbohydrate and fat can be minimal this week without significant harm. Protein deficiency in week one while in deficit causes muscle loss that takes weeks to recover." },
        { q: "I trained hard yesterday and I'm much more sore than usual.", a: "Likely the reduced caloric intake rather than the medication directly. Muscle recovery requires adequate protein and total energy — both reduced in week one. DOMS persisting beyond 72 hours signals inadequate recovery. Ensure 30–40g protein within 60–90 minutes after training even when not hungry. Consider reducing training volume, not stopping, this week." },
      ]}],
      low_recomp: [{ title: "Week 1 — Performance Users", questions: [
        { q: "I train 5 days a week. Do I need to take the week off?", a: "Not the week off, but a significant reduction. Reduce to 3 sessions this week, drop volume by 40%, maintain intensity on the primary movements that matter most. The session you do this week is about maintaining the neuromuscular signal — not fitness output. Pre-workout nutrition is critical: eat carbohydrates 90 minutes before training even when not hungry." },
        { q: "My performance has already dropped significantly in just a few days. Is this permanent damage?", a: "Not permanent. Performance drops primarily reflect glycogen depletion and neuromuscular fatigue from altered energy substrate availability — not actual muscle loss. Performance typically returns to baseline within 2–4 weeks. Eat 30–50g of carbohydrate pre-workout even at low total intake — this makes a measurable difference to performance." },
        { q: "I'm using a lower dose for body composition. Why do I still feel this bad?", a: "Even at lower doses, the GI adaptation response in week one is largely a class effect rather than purely dose-dependent. Most low-dose users find side effects resolve meaningfully by day 10–12 rather than day 14–21, and severity is often lower — but the management strategies are the same: night injection, small meals, ginger, electrolytes." },
      ]}],
      metabolic: [{ title: "Week 1 — Metabolic Health Specific", questions: [
        { q: "My blood glucose has already improved significantly. Is this right?", a: "Yes — one of the most striking early effects. GLP-1 agonists stimulate insulin secretion in a glucose-dependent manner and suppress glucagon within hours of the first dose. Fasting glucose improvements in the first week are well-documented. If you're monitoring at home, expect to see fasting readings trending down within 3–5 days. Document these readings as your baseline response data." },
        { q: "I'm on insulin and worried about going too low. What should I watch for?", a: "Hypoglycemia awareness is critical this week. GLP-1 improves insulin sensitivity — if your insulin dose was calibrated to your pre-treatment glucose levels, it may now be too high. Signs: shakiness, sweating, heart pounding, confusion, lightheadedness. Treat any reading below 70 mg/dL with 15g fast carbohydrate. Contact your doctor immediately if having hypoglycemic episodes — insulin dose reduction is likely needed this week." },
        { q: "I'm on metformin and stomach symptoms are much worse than expected.", a: "GI side effects from metformin and GLP-1s can be additive in week one. Switching from immediate-release to extended-release metformin (metformin ER) significantly reduces GI side effects — worth discussing with your doctor this week. Same medication, substantially better GI tolerability. Do not reduce or stop metformin without guidance." },
      ]}],
    }
  },
  w3: {
    week: "Weeks 2–3", label: "Adaptation Phase", icon: "③",
    color: T.amber,
    tagline: "Side effects ease — habits become the priority",
    universal: [
      { title: "Physical Changes Weeks 2–3", questions: [
        { q: "Nausea has improved but not gone completely. Is that normal?", a: "Yes. Nausea typically improves significantly by week 2 but partial nausea can persist for 4–8 weeks at starting dose. The pattern: week one severe, week two noticeably better, week three manageable. Each dose escalation often brings a temporary return for 1–2 weeks before adapting again. If nausea is worsening rather than improving through weeks 2–3, discuss with your prescriber rather than waiting." },
        { q: "I'm still constipated despite magnesium and water.", a: "Weeks 2–3 constipation that persists requires escalation. Add osmotic laxatives (MiraLax) one sachet daily, psyllium husk fibre supplement, and increase walking. If no improvement within 48 hours, contact your doctor. Do not normalize constipation beyond 5–6 days without intervention." },
        { q: "I'm experiencing heartburn or acid reflux I didn't have before.", a: "Slowed gastric emptying can increase reflux. Management: avoid lying down for 2–3 hours after eating, reduce meal volume, avoid high-fat foods and citrus, sleep with the head of your bed slightly elevated. Over-the-counter antacids can help acutely. If severe or persistent, discuss with your prescriber — this can occasionally be a reason to adjust dose." },
        { q: "My face looks more drawn or gaunt. Is this normal?", a: "Yes — colloquially called 'GLP-1 face'. Fat loss occurs throughout the body and the face often shows changes early and visibly. It's not a health signal. It typically moderates as the rate of weight loss slows. Adequate protein and hydration support skin elasticity." },
      ]},
      { title: "Nutrition and Training — Early Questions", questions: [
        { q: "I'm not hitting my protein target because I can't eat enough. What do I do?", a: "Protein shakes are not a compromise — they are the right tool for this situation. Greek yoghurt (17g per 200g), cottage cheese (25g per 200g), eggs, tinned fish (25g per 95g tin), casein or whey shake. Eat protein first at every meal before anything else. If you can only eat 400 calories, make 120–150g of them protein." },
        { q: "Can I return to normal training?", a: "Weeks 2–3: cautious return. If nausea has improved and you're eating more consistently, increase training intensity gradually to 70–80% of previous intensity. Keep cardio at low-moderate intensity. Your recovery capacity is reduced in a caloric deficit — the same training load will feel harder and recover more slowly. This is physiological, not fitness decline." },
        { q: "What happens if I miss a dose?", a: "For weekly GLP-1s: if you're within 4 days of your scheduled dose, inject as soon as you remember and resume your regular schedule. If it's more than 4 days since the missed dose and your next scheduled dose is within 2 days, skip the missed dose — do not double dose. Missing one dose occasionally won't meaningfully affect outcomes." },
      ]},
    ],
    byTrack: {
      high_loss: [{ title: "Physical Changes Weeks 2–3 — Higher BMI", questions: [
        { q: "I've lost 8–10 pounds in two weeks. Is this too fast?", a: "At higher starting BMI, 8–10 pounds in two weeks is at the high end of normal. Weeks 1–2 loss breaks down as roughly 3–4 pounds fluid (week one) then 1–2 pounds actual fat per week in week two. If losing more than 2 pounds of fat per week consistently, the deficit is likely too aggressive and muscle loss risk increases. Check: are you eating at least 1,400–1,600 calories and hitting protein targets?" },
        { q: "My feet and ankles have less swelling. Is that the medication?", a: "Yes — peripheral edema reduction is a documented early benefit. Reduced caloric intake decreases insulin levels, which reduces sodium and water retention. Even modest weight loss reduces hydrostatic pressure on lower extremity veins. Many people notice this before significant scale changes — it's a meaningful early clinical indicator." },
        { q: "I'm losing weight but I still feel the same way about my body. Is that normal?", a: "Completely normal. Body image — the internal representation of your body — updates far more slowly than the physical reality. Many people describe looking in the mirror at week 3 and seeing essentially the same person despite meaningful measurable change. This lag is a well-documented psychological phenomenon. It typically resolves over months, not weeks." },
      ]}],
      mid_loss: [{ title: "Building Habits in the Window — Moderate BMI", questions: [
        { q: "Nausea is better. What should 'normal' eating look like now?", a: "The temptation is to return to pre-medication eating patterns — just eating less of them. Better 'normal': three structured meals with protein first at each, resistance training twice per week minimum, protein target tracked loosely. The habits you establish in weeks 2–4 — when GI adaptation is stabilizing — are the habits most likely to stick. Use this window deliberately." },
        { q: "I have a work trip planned for week three. How do I manage?", a: "Inject mid-week before the trip. Bring medication in carry-on (not checked luggage). Most pens are stable at room temperature below 77°F for 28 days once opened — a business trip is fine. At restaurants: order protein first, eat slowly, stop at the first signal of fullness. Alcohol at work events: tolerance has changed significantly — one drink may hit much harder than before." },
        { q: "My cravings for specific foods have changed. Things I used to love don't appeal to me anymore.", a: "One of the most consistently reported and least explained experiences of early GLP-1 therapy. Food preferences — particularly for high-fat, high-sugar, ultra-processed foods — often shift meaningfully in the first 2–4 weeks. The mechanism involves GLP-1 receptor effects in the brain's reward circuitry. These shifts tend to be durable though they moderate somewhat as the body adapts." },
      ]}],
      mid_recomp: [{ title: "Recomposition Progress Weeks 2–3", questions: [
        { q: "The scale has barely moved in three weeks. My partner thinks the medication isn't working.", a: "The scale not moving during a recomposition protocol is evidence it's working, not failing. If you've lost 2 pounds of fat and gained 1.5 pounds of muscle, the scale shows a 0.5 pound change while body composition has improved significantly. The metrics that show recomposition working: measurements reducing at waist, strength increasing or maintaining, clothes fitting differently." },
        { q: "My strength has actually increased slightly despite being on the medication. Is that possible?", a: "Yes — and it's the best possible signal that your approach is working correctly. Strength gains during a mild caloric deficit are possible due to neurological adaptations in the first 8–12 weeks. This pattern — scale static, strength increasing, measurements shifting — is textbook successful recomposition. Document it carefully." },
        { q: "I'm thinking about adding creatine. Is it appropriate alongside GLP-1?", a: "Yes — creatine monohydrate is the most evidence-supported supplement for preserving and building muscle during caloric restriction and is appropriate alongside GLP-1 therapy with no meaningful interaction. Dosing: 3–5g daily consistently, no loading phase required. Expect a 1–2kg scale increase in the first week as creatine draws water into muscle cells — this is not fat gain." },
      ]}],
      low_recomp: [{ title: "Returning to Performance — Weeks 2–3", questions: [
        { q: "My performance has bounced back significantly from week one. Can I return to full training volume?", a: "Return to full volume in stages over weeks 2–4 rather than immediately. Your total caloric intake is still below your pre-medication baseline — full training volume at reduced intake produces accumulated fatigue over 2–3 weeks that then requires a deload. Return to 75% of volume in week two, add another 10–15% in week three. Monitor resting heart rate on waking — elevated HR is an early overtraining signal." },
        { q: "My appetite is suppressed but I need to eat enough to train. How do I balance this?", a: "Structure eating around training rather than hunger signals. Pre-workout meal 90 minutes before training regardless of appetite (30–50g carbohydrate, 20–30g protein), intra-workout nutrition for sessions over 60 minutes (20–30g fast carbohydrate), post-workout within 45 minutes (30–40g protein, 40–60g carbohydrate). Calculate your training day energy requirement and eat to that target regardless of appetite signals." },
        { q: "I'm noticing muscle definition I've never had before. Is this real?", a: "Likely real. Visible muscle definition emerges when subcutaneous fat reduces sufficiently for underlying muscle structure to show. At lower starting BMI, this threshold is closer and early fat loss produces visible definition faster. The fact that you're seeing definition rather than just looking smaller confirms fat is being lost while muscle is being preserved." },
      ]}],
      metabolic: [{ title: "Metabolic Marker Changes — Weeks 2–3", questions: [
        { q: "My fasting glucose readings are now consistently in the normal range. Can I reduce my diabetes medication?", a: "This is a prescriber decision that needs to happen this week — not at your next scheduled appointment. If your glucose is normalizing and you're on the same dose of insulin or sulfonylurea, hypoglycemia risk is real and increasing. Contact your prescriber proactively and share your home glucose log. Most prescribers will adjust medications once 7–10 days of consistent improvement is demonstrated." },
        { q: "My blood pressure has dropped significantly. I'm on blood pressure medication — should I be concerned?", a: "Yes — proactively. If home blood pressure readings are consistently below 110/70 or you're experiencing dizziness on standing or lightheadedness, contact your prescriber this week. Antihypertensive dose reduction is commonly needed within weeks 2–6 of starting GLP-1 therapy in people who were previously on medication." },
        { q: "My energy levels are higher than they've been in years even though I'm eating less. Why?", a: "Several mechanisms converging: reduced insulin levels improve cellular energy availability, early improvements in sleep quality contribute, reduced inflammatory burden supports mitochondrial function, and for people with previously elevated blood glucose, normalized glucose eliminates the energy-draining effects of hyperglycemia. This improvement often arrives before significant weight loss — it's a direct metabolic benefit." },
      ]}],
    }
  },
  w6: {
    week: "Weeks 4–6", label: "Finding Rhythm", icon: "④",
    color: T.sage,
    tagline: "Side effects resolved — habits become the deciding factor",
    universal: [
      { title: "Physical Progress Weeks 4–6", questions: [
        { q: "The scale slowed dramatically from week one. Has the medication stopped working?", a: "No. The rapid early loss was fluid and glycogen. The rate you're experiencing now — 0.3–1kg per week — is actual fat loss. This rate is physiologically appropriate, sustainable, and protective of muscle mass. Rates above 1% of body weight per week are associated with increased lean mass loss. The deceleration is the medication working as intended at a sustainable rate." },
        { q: "I'm experiencing hair loss. Is this from the medication?", a: "Almost certainly from caloric restriction and nutritional stress rather than the medication itself. Telogen effluvium — stress-triggered hair shedding — typically appears 2–4 months after a physiological stressor, but the trigger is happening now. Ensure adequate protein, zinc, iron, and biotin. It is almost always temporary — hair typically regrows over 3–6 months once nutrition normalizes." },
        { q: "My energy has returned but gym performance is still below normal.", a: "Expected and physiologically explained. Training performance in a sustained caloric deficit is reduced due to reduced glycogen availability and impaired recovery. You can maintain strength with reduced volume but should not expect personal bests while in a significant deficit. The goal is preserving the strength stimulus — not optimizing performance. That phase comes after." },
      ]},
      { title: "Nutrition, Habits, and Psychology", questions: [
        { q: "I'm eating much less than before but worried I'm undereating.", a: "This is a real and underappreciated risk. GLP-1s can suppress appetite so effectively that people genuinely eat 600–900 calories daily without feeling uncomfortable. At that level: metabolism adapts downward, muscle loss accelerates, micronutrient deficiencies develop rapidly, and mood suffers. Eat by the clock — scheduled meals at fixed times regardless of appetite signals." },
        { q: "I've hit a plateau at week 5 or 6. What now?", a: "A plateau at weeks 5–6 at starting dose is common and expected. Your body has recalibrated to a new lower intake and is defending its current weight — normal metabolic adaptation. Three responses in order: confirm it's actually a plateau (body composition may be changing even if the scale isn't), assess nutrition honestly, then discuss dose escalation with your prescriber if you've completed the minimum duration at starting dose and side effects have resolved." },
        { q: "My mood and anxiety feel elevated. Is this the medication?", a: "Anxiety is a documented but underreported side effect of GLP-1 agonists in a subset of users. The mechanism may involve changes in gut-brain signalling via the vagus nerve. If anxiety is new and correlates with injection timing, document it and discuss with your prescriber. If worsening week on week regardless of injection timing, it warrants clinical evaluation — not just reassurance." },
        { q: "Should I be taking any supplements?", a: "Recommended for almost everyone: magnesium glycinate 300–400mg daily (constipation prevention, sleep quality), vitamin D if deficient, a high-quality multivitamin as nutritional insurance. Consider adding if bloodwork indicates: iron with vitamin C, zinc, B12. Avoid: collagen counted toward protein targets (incomplete amino acid profile), and any 'fat burner' supplements while on GLP-1s." },
      ]},
    ],
    byTrack: {
      high_loss: [{ title: "Progress and Reality — Weeks 4–6 at Higher BMI", questions: [
        { q: "I've lost 20 pounds but still feel like I look the same. When does that change?", a: "The disconnect between physical change and perceived change is one of the most universal experiences at higher starting BMI. The perceptual shift often arrives not as a gradual adjustment but as a sudden moment of recognition — frequently triggered by a photo, fitting into a booth or airplane seat more comfortably, or someone's unexpected reaction. Keep the data. The subjective perception will catch up." },
        { q: "People are starting to notice and comment. How do I respond?", a: "You don't need a rehearsed speech. 'Thank you, I'm working on my health' is complete. 'I'm on a medically supervised program' redirects to the clinical framework without inviting debate. Avoid responding with self-deprecation about how far you still have to go — it's a pattern worth breaking early." },
        { q: "Hair loss has started and it's distressing. What can I actually do?", a: "Maximize protein intake (the single most important dietary intervention), add zinc 15–25mg daily, iron and ferritin if not already adequate (get blood levels tested — low ferritin is a significant driver of hair loss that is often missed), and biotin 2.5–5mg daily. Expensive shampoos and topical treatments won't help — they address pattern hair loss, not telogen effluvium." },
        { q: "My doctor is talking about bariatric surgery as a complement. Should I consider it?", a: "At higher BMI, bariatric surgery and GLP-1 therapy are complementary options rather than competing ones. If your doctor is raising surgery, it's worth an informed consultation with a bariatric specialist — not as a commitment, but as information gathering. The decision is never urgent; gathering information now costs nothing." },
      ]}],
      mid_loss: [{ title: "Consolidating the Program — Moderate BMI", questions: [
        { q: "My doctor is escalating my dose. What should I prepare for?", a: "A temporary return of nausea and GI symptoms for 1–2 weeks — typically less severe than week one because your GI system has partially adapted. Prepare the same way you prepared for week one: ginger, electrolytes, small meal plans ready, schedule the escalation mid-week. After 2–3 weeks of adaptation, appetite suppression typically increases meaningfully and weight loss often accelerates." },
        { q: "I'm starting to think about what happens when I stop. I'm scared of regaining.", a: "This fear arrives right on schedule and is healthy to engage with rather than suppress. The research is honest: most people regain significant weight within 12 months of stopping without a structured maintenance plan. The factors most protective against regain are the ones you're building right now — consistent resistance training, reliable protein intake, and a genuinely changed relationship with food." },
        { q: "My relationship with food feels completely different. Is this permanent?", a: "Partially. The neurological changes GLP-1 therapy produces in food reward circuitry are real and have some durability beyond the medication period. People often report genuinely different tastes after GLP-1 therapy. The appetite suppression itself reduces when medication is stopped, but behavioral habits and preference shifts that were reinforced during treatment tend to persist more than people expect." },
      ]}],
      mid_recomp: [{ title: "Recomposition — When Results Start Becoming Visible", questions: [
        { q: "I'm seeing real changes in body composition for the first time. How do I capitalize on this?", a: "Don't change what's working. The combination of moderate deficit, adequate protein, and consistent resistance training that produced these results is the formula. The temptation at weeks 4–6 is to cut calories further to accelerate results or add more cardio. Both typically slow recomposition by increasing lean mass loss and impairing recovery. Stay on the program, add progressive overload to resistance training, let results accumulate." },
        { q: "My waist is reducing faster than other areas. Is this normal?", a: "Yes. Abdominal fat — particularly visceral fat — tends to respond earlier and faster to caloric deficit and GLP-1 therapy specifically, because visceral fat is metabolically more active and sensitive to insulin changes. Subcutaneous fat in peripheral areas responds more slowly. The distribution will not fully 'even out' — genetic fat patterning means some areas are more resistant — but with sustained fat loss, all areas eventually respond." },
        { q: "Should I be doing a cut or staying in a slow deficit for the full 12 weeks?", a: "For recomposition at moderate BMI, a consistent slow deficit (300–400 calories below maintenance) for the full 12 weeks produces better body composition outcomes than more aggressive cuts. Aggressive cuts accelerate fat loss but disproportionately increase lean mass loss where there's less fat available as a preferential energy source. The slow deficit is also more compatible with training performance." },
      ]}],
      low_recomp: [{ title: "Performance and Protocol Decisions — Weeks 4–6", questions: [
        { q: "I've reached my body composition goal ahead of schedule. Should I stop?", a: "Reaching your goal early requires a deliberate decision. Three options: stop completely (highest regain risk), taper to a lower maintenance dose (most common for performance users), or take a planned break with a clear protocol for the off period. The minimum before stopping: ensure resistance training and protein intake are genuinely habitual, not effortful, and have a specific plan for the first 4–6 weeks post-medication." },
        { q: "My training performance has fully recovered and is actually better than before. Why?", a: "Improved body composition directly improves performance metrics relative to body weight — power-to-weight ratio, relative strength, speed, and aerobic efficiency all improve as body fat decreases while muscle mass is maintained. If you've achieved meaningful fat loss while preserving muscle, the same absolute strength output now moves a lighter body — producing better relative performance." },
        { q: "I want to run a bulk cycle after this. How do I transition?", a: "Allow 4–6 weeks post-medication for appetite to fully normalize before introducing a true caloric surplus. Rushing into a bulk immediately after stopping typically produces fat regain rather than muscle gain because the appetite return is sudden and eating patterns aren't established. Sequence: taper medication over 3–4 weeks, hold at maintenance for 4–6 weeks, then introduce a modest surplus of 200–300 calories." },
      ]}],
      metabolic: [{ title: "Metabolic Assessment and Long-Term Framing — Weeks 4–6", questions: [
        { q: "My 6-week bloodwork shows significant improvements across the board. What does this mean?", a: "What each improvement means: fasting glucose and HbA1c trending down — glucose metabolism is responding as intended. Triglycerides reducing significantly — liver fat metabolism improving. HDL increasing — insulin sensitivity improving. ALT and AST reducing — liver inflammation resolving. These are not just numbers — they each represent a specific physiological improvement with real clinical significance." },
        { q: "My HbA1c is now in the normal range. My doctor says I may be in remission from diabetes. What does that actually mean?", a: "Diabetes remission is defined as HbA1c below 6.5% sustained for at least 3 months without glucose-lowering medication. It means your beta cells are producing enough insulin for your current degree of insulin sensitivity and that sensitivity has improved to the normal range. It is not a cure — if the lifestyle factors that enabled remission are not sustained, diabetes can return. GLP-1 therapy is one of the most effective interventions for achieving remission in early or moderate type 2 diabetes." },
        { q: "I feel so much better that I'm tempted to stop the medication. How do I think about this?", a: "Feeling better is not the same as being better — and this distinction matters most in chronic disease management. The improvements you're experiencing are the medication working. Stopping because you feel well is analogous to stopping a statin because your cholesterol has normalized. The informed decision about stopping should be based on: how durable your lifestyle changes are, what your markers do when dose is reduced, and a structured conversation with your prescriber." },
        { q: "My insurance is pushing back on continued coverage after 6 weeks. What should I do?", a: "What supports continued coverage: your 6-week bloodwork showing measurable response, documentation from your prescriber of the clinical indication and response, and citation of SELECT trial evidence for cardiovascular indications. Ask your prescriber to document clinical response and indication clearly. If denied, a peer-to-peer review between your prescriber and the insurance medical director has a significantly higher success rate than a standard appeal." },
      ]}],
    }
  },
  w9: {
    week: "Weeks 7–9", label: "The Plateau Zone", icon: "⑤",
    color: T.amber,
    tagline: "The most misunderstood phase of the journey",
    universal: [
      { title: "When the Scale Stops Moving", questions: [
        { q: "I've completely plateaued for three weeks. What should I do?", a: "A genuine plateau (no scale movement, no measurement change, no body composition change over 3+ weeks) typically has one of three causes: metabolic adaptation to current caloric intake, consuming more calories than the suppressed appetite suggests (liquid calories, high-palatability foods, frequent small amounts), or having reached the efficacy ceiling of the current dose. In order: first do an honest food audit for one week. If intake is genuinely low and the plateau persists, discuss dose escalation with your prescriber." },
        { q: "My prescriber wants to increase my dose. What should I expect?", a: "A temporary return of weeks-1-2 side effects — most commonly nausea, fatigue, and constipation for 1–2 weeks as your body adapts to the higher dose. Severity is usually less than at starting dose because your GI system has partially adapted. Management: same approach as week one (night injection, cold foods, small meals, ginger, electrolytes, magnesium). After 2–3 weeks at the new dose, efficacy typically improves noticeably." },
        { q: "I feel like I'm cheating somehow — like this isn't earned.", a: "One of the most universally felt but least discussed experiences. Managing a chronic condition with appropriate medical support is healthcare, not cheating. The cultural narrative around weight loss as a moral test is not a clinical framework. You still make the choices about training, protein, and habits that determine the quality of your outcome." },
        { q: "My motivation has completely dropped. The novelty has worn off.", a: "Expected at this stage. The dramatic early changes have normalised and the novelty has gone. This is where habit architecture matters more than motivation. Focus on process metrics you control — training sessions completed, protein targets hit, injection on schedule — rather than the outcome metric of the scale." },
      ]},
      { title: "Body Composition and Training", questions: [
        { q: "I'm losing weight but I look softer not leaner. Why?", a: "The most common explanation: inadequate resistance training and/or inadequate protein, producing a ratio of muscle-to-fat loss that doesn't favour the lean outcome most people are working toward. Losing fat and muscle simultaneously produces a 'smaller but same shape' effect. The fix is not to lose less weight — it's to change what you're losing. This requires prioritising resistance training and protecting protein targets." },
        { q: "How important is resistance training really?", a: "It is not optional if your goal is body composition rather than just scale weight. Without resistance training during GLP-1-induced weight loss, 25–40% of lost weight is lean mass. That lean mass loss has consequences beyond aesthetics — muscle supports insulin sensitivity, resting metabolism, functional strength, and long-term weight maintenance. Two sessions per week of compound resistance training is the minimum. Three is better." },
      ]},
    ],
    byTrack: {
      high_loss: [{ title: "The Long Game — Higher BMI Weeks 7–9", questions: [
        { q: "I've lost 35 pounds but feel like I'm only partway through a long journey. How do I sustain motivation?", a: "Motivation as a fuel source runs out — this is not a personal failing, it's how motivation works. At weeks 7–9 the goal is to have established enough habit and identity that the program continues when motivation is absent. Shift your success metrics from outcome-based (pounds lost, goal weight) to process-based (training sessions per week, protein targets hit, injection on schedule). These are entirely within your control." },
        { q: "My skin is loose in multiple areas now. At what point should I think about skin removal surgery?", a: "The clinical recommendation is to wait a minimum of 12–18 months after reaching and stabilizing at your goal weight before considering skin removal surgery. This allows skin to adapt naturally — often more than people expect — and ensures weight loss is stable before surgical intervention. Resistance training to maintain muscle volume beneath loose skin, adequate protein, and hydration are the most effective current interventions." },
        { q: "I've started to enjoy movement in a way I never did before. Is this the medication?", a: "Likely both — GLP-1 receptors are present in the brain's reward circuitry with emerging evidence that GLP-1 agonists may enhance the reward response to physical activity. More importantly, reduced body weight directly changes the physical experience of movement — less joint load, less cardiovascular strain, better proprioception. Whatever the mechanism, this shift is worth protecting. It's one of the most durable positive changes and strongest predictors of long-term weight maintenance." },
        { q: "My orthopedic surgeon says I may not need knee surgery after all. What happened?", a: "Weight loss has a direct and often dramatic effect on joint health. Every pound of body weight generates approximately 4 pounds of force across the knee joint during walking — losing 30 pounds reduces knee joint load by roughly 120 pounds per step. This reduction in mechanical load combined with reduced systemic inflammation can produce significant improvements in joint function. Some people who were considered surgical candidates become non-surgical candidates after meaningful weight loss." },
      ]}],
      mid_loss: [{ title: "Approaching Goal and What Comes Next — Moderate BMI", questions: [
        { q: "I'm within 5 pounds of my goal weight. Should I be thinking about maintenance now?", a: "Yes — and ideally you've been thinking about it for the past 3 weeks. The most common mistake is treating goal weight as a finish line rather than a transition point. Before you reach goal weight: identify your maintenance caloric intake (typically 200–400 calories above current intake), have a plan for how you'll manage the medication, and confirm that your training habit is genuinely established." },
        { q: "I've reached my goal weight but I don't feel how I expected to feel.", a: "The arrival fallacy — the belief that reaching a specific goal will produce a sustained emotional payoff — is one of the most reliably disappointing aspects of goal achievement. Most people reach goal weight and feel a brief moment of satisfaction followed by a return to baseline mood. The question worth asking: what did you expect to feel different, and is that actually weight-dependent?" },
        { q: "People who knew me before ask constantly how I did it. How do I handle these conversations?", a: "You've become an inadvertent ambassador for a medication that is both popular and controversial. 'I've been working with my doctor on my health' is a complete response. If you want to share more: 'I'm on a medically supervised weight management program' is accurate. If someone is genuinely interested for themselves, 'talk to your doctor about what options might be right for you' is the right referral rather than a specific recommendation." },
      ]}],
      mid_recomp: [{ title: "Recomposition at Weeks 7–9 — Evolving the Approach", questions: [
        { q: "My body composition has changed significantly but my strength hasn't increased as much as I expected.", a: "Strength gains in a sustained caloric deficit are limited — your body has been prioritizing fat loss over strength development throughout this protocol. Visible body composition improvement can occur alongside flat or modest strength progress when fat loss is the primary driver of the changed appearance. The strength gains you're looking for will come more effectively in a subsequent phase at or above maintenance calories with a dedicated hypertrophy training program." },
        { q: "My DEXA scan shows I've lost fat and gained muscle simultaneously. Is this actually possible?", a: "Yes — particularly in a well-executed GLP-1 recomposition protocol. True simultaneous fat loss and muscle gain is most reliably achieved when: you're in a modest rather than aggressive deficit, protein intake is high, resistance training provides a consistent progressive stimulus, and anabolic adaptations are running at a rate that outpaces the catabolic pressure. Your DEXA data is the most accurate measurement available. Trust it over what the scale or mirror tells you." },
        { q: "I want to switch from recomposition to a dedicated muscle-building phase. When?", a: "When you've reached your target body fat percentage and are ready to accept some increase in scale weight from muscle gain. Transition: over 2–3 weeks, increase caloric intake toward maintenance by adding 100–150 calories per week, primarily from carbohydrates and protein. Once at maintenance for 2 weeks and training performance is fully normalized, introduce a modest surplus of 200–300 calories." },
      ]}],
      low_recomp: [{ title: "Decision Point and Performance Optimization — Weeks 7–9", questions: [
        { q: "I've achieved the body composition I wanted. What's the right way to stop?", a: "A structured taper over 4–6 weeks. Suggested: reduce to half your current dose for 3 weeks, then quarter dose for 2 weeks, then stop. During the taper: maintain protein targets and training program deliberately — these habits are your primary maintenance tools. Have a clear re-escalation plan if body composition begins deteriorating significantly." },
        { q: "My training performance is at all-time highs. Is this sustainable after stopping?", a: "Yes — but the question is whether body composition maintenance is achievable without the medication's appetite modulation. For people who have established strong training habits and whose food relationship has genuinely shifted, maintenance is very achievable. For people whose discipline relied primarily on the medication's suppression rather than established habits, some regression toward previous body composition often occurs within 3–6 months." },
        { q: "I'm considering using a very low maintenance dose indefinitely. Is there evidence this is safe?", a: "Long-term safety data for GLP-1 agonists at therapeutic doses is now extensive — 3–5 year follow-up data shows a favorable safety profile. Data specifically for sub-therapeutic maintenance doses in lean individuals is more limited. The practical considerations for ongoing use: periodic prescriber review (annually at minimum), monitoring for any emerging side effects, and a clear conversation with your prescriber about the rationale and monitoring plan." },
      ]}],
      metabolic: [{ title: "Consolidation and Long-Term Decisions — Metabolic Health Weeks 7–9", questions: [
        { q: "My 8-week bloodwork is back. How do I interpret what's changed and what hasn't?", a: "HbA1c should show meaningful improvement if your glucose has been better controlled — expect 0.5–1.5% reduction if you started in diabetic or pre-diabetic range. Triglycerides should show the most dramatic improvement — often 30–50% reduction. HDL may be trending up. Liver enzymes (ALT, AST) should be trending toward normal if elevated at baseline. Blood pressure should be lower. Ferritin and B12 are worth checking now if not done at baseline — reduced intake for 8 weeks can begin depleting these." },
        { q: "My cardiologist says the SELECT trial data means I should stay on this medication indefinitely. I'm not sure how I feel about that.", a: "Your uncertainty is reasonable and worth exploring. The SELECT trial enrolled people with established cardiovascular disease — if that describes you, the evidence for long-term benefit is strong. The honest conversation: what specifically would the benefit of ongoing treatment be for your specific cardiovascular risk profile? What does the monitoring plan look like? What would be the criteria for reconsidering? Long-term medication decisions require ongoing informed consent, not a one-time agreement." },
        { q: "My kidney function has actually improved since starting. Is this expected?", a: "Yes — GLP-1 agonists have demonstrated direct renoprotective effects beyond what would be expected from weight loss and blood pressure improvement alone. The FLOW trial with semaglutide showed significant reduction in kidney disease progression in people with type 2 diabetes and chronic kidney disease. Improved eGFR and reduced urinary albumin excretion are both positive signals — your nephrologist should be informed of the improvement and the medication responsible for it." },
        { q: "I feel like a different person metabolically. My energy, sleep, and cognitive clarity have all improved.", a: "All three improvements have plausible mechanistic connections to GLP-1 therapy. Energy: normalized glucose metabolism eliminates the energy-draining cycles of hyperglycemia. Sleep: weight loss reduces sleep apnea severity and normalized glucose reduces nocturnal hypoglycemia episodes that fragment sleep. Cognitive clarity: GLP-1 receptors are present in the brain and hyperglycemia itself impairs cognition acutely — normalizing glucose produces noticeable cognitive improvement. These improvements are durable as long as metabolic health is maintained." },
      ]}],
    }
  },
  w12: {
    week: "Weeks 10–12", label: "Building the Exit", icon: "⑥",
    color: T.teal,
    tagline: "Sustainable results require a plan before you need one",
    universal: [
      { title: "The Long-Term Picture", questions: [
        { q: "Will I have to take this forever?", a: "For many people, long-term or indefinite treatment produces the most durable outcomes. Discontinuation studies consistently show significant regain in most who stop without durable lifestyle change. The medication creates the conditions for change — the habits you build during treatment determine what happens after. This is not a character failing — it reflects the chronic disease model of metabolic dysfunction." },
        { q: "If I stop, what should I actually expect?", a: "Appetite returns — often quickly and forcefully. The first 4–8 weeks post-discontinuation are the highest risk period for rapid regain. Having a clear nutritional and training plan in place before stopping, not after, is critical. Gradual dose taper over 4–6 weeks is strongly preferred over abrupt cessation." },
        { q: "What should I retest at 3 months?", a: "Repeat your baseline labs: fasting glucose, HbA1c, lipid panel, liver function, kidney function, full blood count. Add: ferritin and iron (deficiency is common after 3 months of reduced intake), vitamin D, B12, zinc. If you did a baseline DEXA, repeat it — the before/after body composition data is often more informative than the scale." },
        { q: "What does a genuinely successful 3-month outcome look like?", a: "Not just the scale. A genuinely successful 3-month outcome: meaningful fat loss with preserved lean mass, improved metabolic markers, an established training habit, consistent protein targets, a healthier relationship with food, and a clear plan for what comes next. If the weight has changed but the habits haven't, the outcome is incomplete." },
        { q: "What are the things people most commonly regret not doing differently?", a: "Starting resistance training later than they should have — muscle lost in months 1–3 is hard to rebuild. Not taking protein seriously enough in weeks 1–6. Measuring success only by scale weight. Not having a prescriber who followed up properly. Not addressing the psychological relationship with food. And underestimating how hard the first three weeks actually are." },
      ]},
    ],
    byTrack: {
      high_loss: [{ title: "Three Months In — Higher BMI Assessment and Planning", questions: [
        { q: "I've lost significant weight but still have a long way to go. How do I think about the next phase?", a: "Three months is enough data to project forward meaningfully. Planning questions for the next phase: is the current dose still producing adequate appetite suppression, or is escalation appropriate? Are the habits genuinely consolidated, or still requiring significant effort? Are there any emerging nutritional deficiencies? For significant weight loss goals at higher starting BMI, 3 months is the beginning of the journey — not the end. Maximum weight loss with GLP-1 therapy typically occurs at 12–18 months of sustained treatment." },
        { q: "I feel genuinely different — not just physically but as a person. How do I integrate this change?", a: "Identity — how you understand yourself, how you navigate the world, how others relate to you — is deeply connected to body for many people. The change you're describing is real. It can include: a different relationship with physical space, a different experience of how others interact with you, and a different internal narrative about what you're capable of. These changes deserve reflection and integration, not just celebration. Journaling, therapy, or meaningful conversations with trusted people are all valuable ways to process an identity shift of this magnitude." },
        { q: "My weight loss has slowed significantly in weeks 10–12. Is this a sign I should stop?", a: "Slowing rate of loss in weeks 10–12 is physiological and expected — as body weight reduces, the caloric deficit required for the same rate of loss reduces, and metabolic adaptation accumulates. The appropriate response is usually dose reassessment with your prescriber, lifestyle optimization review, and expectation calibration — not stopping. Stopping at this stage because loss has slowed typically produces rapid regain before the habits that would support maintenance are established." },
      ]}],
      mid_loss: [{ title: "Transitioning to Maintenance — Moderate BMI", questions: [
        { q: "I'm at or near my goal weight. How do I transition from weight loss mode to maintenance?", a: "Add 100–150 calories per week until weight stabilizes, prioritizing protein and complex carbohydrates. Give each adjustment 2 weeks before further changes — weight fluctuates enough that week-to-week readings are unreliable feedback. Shift training from deficit-focused to maintenance-focused: resistance training primary, activity for health and enjoyment rather than caloric expenditure." },
        { q: "My biggest fear is regaining the weight. What's the evidence-based approach to preventing regain?", a: "Resistance training practiced consistently, protein intake at 1.4–1.6g/kg maintained, regular self-monitoring (weekly weigh-ins — not obsessive but not absent), and having a clear re-escalation threshold — a specific weight at which you take action rather than watching regain accumulate. People who maintain successfully weigh themselves regularly and respond to early upward drift quickly." },
        { q: "I want to get pregnant in the next year. How does that affect my ongoing use?", a: "GLP-1 agonists should be discontinued before attempting to conceive — they are not recommended during pregnancy due to insufficient safety data. Stop at least 2 months before attempting conception. During this window: focus intensively on consolidating the eating and training habits that will support weight maintenance during the preconception and pregnancy periods." },
      ]}],
      mid_recomp: [{ title: "Completing the Recomposition Phase — Weeks 10–12", questions: [
        { q: "My 12-week DEXA shows fat lost and lean mass maintained. What does my next phase look like?", a: "Your next training phase should shift from a recomposition deficit protocol to a muscle-building protocol with appropriate caloric increase. Transition: over 3–4 weeks, increase calories to maintenance by adding 100 calories per week, shift training emphasis from maintaining stimulus in a deficit to progressive overload for hypertrophy, and reassess your relationship with the medication — many recomposition users taper at this point." },
        { q: "What are the habits I absolutely must keep after stopping to preserve my results?", a: "In order of predictive importance: resistance training at least 2–3 times per week consistently — this is non-negotiable for maintaining the muscle you've built or preserved. Protein intake at minimum 1.4–1.6g/kg bodyweight daily. Regular self-monitoring — weekly weight and monthly measurements to catch early drift. Sleep quality. Of these, resistance training is the single most important. People who maintain training after stopping maintain results at significantly higher rates than those who don't." },
        { q: "I want to do another recomposition cycle in 6 months. How should I structure the intervening period?", a: "A planned muscle-building phase between recomposition cycles produces better long-term body composition outcomes than continuous recomposition. Structure: months 1–3 post-recomposition build at a modest caloric surplus (200–300 calories above maintenance) with progressive overload training. Month 4–5, return to maintenance to consolidate. Month 6, reassess body composition and begin second recomposition cycle if desired." },
      ]}],
      low_recomp: [{ title: "Consolidation and Clean Exit — Performance Users", questions: [
        { q: "I've achieved my competition body fat. How do I maintain this without medication long-term?", a: "Maintaining competition or near-competition body fat without pharmacological support requires deliberate nutritional management. Structured eating with scheduled meals rather than hunger-driven eating, protein at 1.8–2.2g/kg to maximize satiety and muscle retention, strategic carbohydrate timing around training, and planned diet breaks at maintenance calories for 1–2 weeks every 8–12 weeks to reset hunger hormone signaling." },
        { q: "My off-season is starting. How does stopping the medication affect my ability to eat in a surplus?", a: "Stopping GLP-1 before an off-season bulk is typically appropriate. After stopping, expect 2–4 weeks for appetite to normalize and potentially overshoot before settling. Plan for this: in the first 2 weeks after stopping, maintain your current eating structure deliberately rather than eating freely in response to returning appetite. Give yourself 3–4 weeks at maintenance before introducing a true surplus." },
        { q: "Three months in — what do I know now that I wish I'd known at the start?", a: "The patterns from performance users at 12 weeks: that the performance impact of week one is temporary but more significant than expected — building that into the training plan from the start reduces anxiety. That liquid nutrition for training day fueling is not a compromise but the optimal tool. That body composition changes are more significant than the scale shows. That the psychological relationship with food changes meaningfully and durably. And that having a prescriber who understands performance goals specifically makes the entire experience significantly better." },
      ]}],
      metabolic: [{ title: "The 3-Month Clinical Assessment — Metabolic Health", questions: [
        { q: "My 3-month HbA1c has dropped from 7.8% to 6.4%. What does this mean clinically?", a: "A 1.4% reduction in HbA1c in 12 weeks is a clinically significant response — above average for GLP-1 therapy in the first 3 months. Your average glucose over the past 3 months has reduced from approximately 175 mg/dL to approximately 135 mg/dL. You're at the upper edge of the pre-diabetic range rather than in the diabetic range. Your 10-year cardiovascular risk has meaningfully reduced. This result justifies continued treatment and warrants a conversation about the path to potential remission." },
        { q: "My liver enzymes have normalized completely after being significantly elevated. What does this mean for my NAFLD?", a: "Normalized liver enzymes after significant elevation are a strong positive signal — they indicate that active liver inflammation has substantially resolved. Enzyme normalization doesn't confirm complete liver fat resolution — that requires imaging. A repeat liver ultrasound at 12 months is appropriate to assess structural improvement. What enzyme normalization does confirm: the dangerous inflammatory phase of NAFLD has resolved and the medication is working on the liver specifically." },
        { q: "I want to stop the medication now that my metabolic markers are normal. My doctor wants me to continue. How do I make this decision?", a: "This involves weighing three things: the evidence for continued benefit, your personal values and preferences around long-term medication use, and the practical question of what monitoring and re-escalation looks like if markers deteriorate. A structured taper with close monitoring at 4 and 8 weeks post-discontinuation, with clear criteria for restarting, converts a binary stop/continue decision into a monitored experiment. That framing often resolves the disagreement." },
        { q: "After 3 months, what has this journey taught me about my metabolic health?", a: "The consistent patterns from metabolic health users at 12 weeks: that metabolic dysfunction is far more responsive to intervention than most people were told. That the metabolic symptoms attributed to 'just getting older' — fatigue, post-meal crashes, cognitive fog, poor sleep — had metabolic causes that were treatable. That the disease framing of metabolic conditions is actually empowering rather than stigmatizing. And that the lifestyle changes made during treatment have benefits that extend far beyond the metabolic markers they were designed to improve." },
      ]}],
    }
  },
};

const STAGE_ORDER = ["pre","w1","w3","w6","w9","w12"];

// ─── PROTEIN DATA ────────────────────────────────────────
const PROTEIN = {
  animal: [
    { name: "Greek Yoghurt (full fat)", protein: 17, serve: "200g tub", cal: 190, rating: 5, notes: "Soft, high volume, easy on a suppressed appetite. Look for: 15g+ protein per 200g. Avoid: flavoured varieties with 15g+ sugar per serve." },
    { name: "Cottage Cheese", protein: 25, serve: "200g", cal: 160, rating: 5, notes: "Soft, easy to eat in small amounts, very high protein density. Blend into smoothies invisibly. Look for: full fat for satiety." },
    { name: "Eggs (whole)", protein: 18, serve: "3 large", cal: 215, rating: 5, notes: "Complete amino acid profile. Scrambled or poached easiest to tolerate. No label traps." },
    { name: "Tinned Salmon or Tuna", protein: 25, serve: "95g tin", cal: 130, rating: 5, notes: "Soft texture, easy in small amounts, shelf stable. Look for: springwater packed. Avoid: oil-packed in seed oils." },
    { name: "Whey Protein Powder", protein: 24, serve: "30g scoop", cal: 120, rating: 5, notes: "Best supplement when solid food is unappealing. Look for: 80%+ protein by weight (24g+ per 30g scoop). Avoid: amino spiking — check for leucine 2g+ per serve." },
    { name: "Casein Protein Powder", protein: 24, serve: "30g scoop", cal: 120, rating: 4, notes: "Slow digesting — better for overnight muscle preservation. Same label rules as whey. Useful before bed." },
    { name: "Chicken Breast (cooked)", protein: 31, serve: "100g", cal: 165, rating: 4, notes: "High protein per gram but dry texture can be difficult. Shredded in broth or as mince in soup is far easier to tolerate than grilled breast." },
    { name: "Lean Beef Mince (5%)", protein: 26, serve: "100g cooked", cal: 175, rating: 4, notes: "Soft when cooked, good in soups and bolognese-style dishes which are easy to eat in small portions." },
    { name: "Protein Bars", protein: 20, serve: "60–70g bar", cal: 220, rating: 3, notes: "Convenient but quality varies enormously. Look for: 20g+ protein, under 10g sugar. Avoid: bars where first 3 ingredients are dates or oats, maltitol (causes significant GI distress on GLP-1s)." },
  ],
  plant: [
    { name: "Tofu (firm)", protein: 17, serve: "150g", cal: 120, rating: 5, notes: "Versatile. Silken tofu blends into smoothies invisibly. Complete amino profile when combined across the day." },
    { name: "Edamame", protein: 17, serve: "1 cup (155g)", cal: 190, rating: 5, notes: "One of the few complete plant proteins. Soft, easy to eat, available frozen. No cooking required. High fibre supports gut motility." },
    { name: "Tempeh", protein: 20, serve: "100g", cal: 195, rating: 4, notes: "Fermented soy — better digestibility than tofu. Higher protein. Easier when crumbled and cooked into sauces." },
    { name: "Pea/Rice Protein Blend", protein: 22, serve: "30g scoop", cal: 120, rating: 4, notes: "Pea/rice blend provides a complete amino profile approaching whey quality. Look for: 70%+ protein by weight. Avoid: maltodextrin as first ingredient." },
    { name: "Lentils (cooked)", protein: 18, serve: "200g cooked", cal: 230, rating: 4, notes: "High protein, high fibre. Red lentils are softer and easier to digest. Start with smaller serves if GI symptoms are prominent." },
    { name: "Seitan", protein: 25, serve: "100g", cal: 140, rating: 4, notes: "Highest protein plant food by weight. Not suitable for celiac or gluten intolerance. Best in small quantities in sauces or soups." },
    { name: "Soy Milk (protein fortified)", protein: 8, serve: "250ml", cal: 100, rating: 3, notes: "Easiest way to add plant protein to drinks. Complete protein. Look for: 7g+ protein per 250ml. Avoid: oat, almond, or rice milk as protein sources — these are 1–2g per serve." },
  ],
  avoid: [
    { name: "Protein bars with maltitol", reason: "Causes significant GI distress — particularly problematic on GLP-1s where GI symptoms are already elevated. Maltitol is common in 'sugar free' bars." },
    { name: "Collagen as your primary protein source", reason: "Incomplete amino acid profile — lacks tryptophan. Counting collagen toward your protein target is a common mistake that contributes to muscle loss." },
    { name: "Oat, almond, or rice milk counted as protein", reason: "These are 1–2g protein per serve. They are carbohydrate drinks, not protein sources." },
    { name: "Bars where sugar or dates are the first ingredient", reason: "Energy bars marketed as protein bars. Rule: protein per 100g should be 25g+ on the label." },
    { name: "High-fat protein sources in large volumes (weeks 1–4)", reason: "Fatty cuts of meat and full-fat cheese in large quantities slow gastric emptying further, worsening nausea significantly." },
  ]
};

// ─── WEEKLY REFLECTION PROMPTS ───────────────────────────
const REFLECTIONS = [
  { week: 1, prompts: ["How has your relationship with hunger changed since your first injection?", "What has been the hardest part of this week — and what has surprised you?", "On a scale of 1–10, how confident do you feel that this is going to work for you? What's driving that number?"] },
  { week: 2, prompts: ["Did you eat by the clock or by hunger this week? How did that feel?", "What social situation around food felt the most complicated — and how did you handle it?", "What's one thing you did for your body this week that had nothing to do with the scale?"] },
  { week: 3, prompts: ["How has your energy changed compared to week one?", "What habit are you most proud of establishing so far?", "Is there anything about how food feels to you now that you weren't prepared for?"] },
  { week: 4, prompts: ["What does 'normal' eating look like for you now versus before you started?", "How is your training responding? Are you recovering better or worse than you expected?", "What would you tell someone who is about to start their first week?"] },
  { week: 5, prompts: ["Has the scale plateau (if you've hit one) affected your motivation? What's keeping you going?", "How is your relationship with food socially — restaurants, events, family meals?", "What physical change (not scale weight) are you most pleased about?"] },
  { week: 6, prompts: ["If you had to describe your emotional relationship with food right now in one word, what would it be?", "What is your biggest fear about continuing this journey? Is it worth examining?", "What habit do you feel is genuinely automatic now versus still requiring effort?"] },
  { week: 7, prompts: ["What does the idea of stopping the medication feel like right now? Relief, fear, or something else?", "How has your body image changed — or not changed — relative to your physical changes?", "What would a 'good day' look like 6 months from now?"] },
  { week: 8, prompts: ["What have you learned about yourself through this process that you didn't know before?", "Is there anything about your approach that you'd do differently if you were starting again?", "Who in your life has been most supportive — and have you told them that?"] },
  { week: 9, prompts: ["How do you define success for yourself at this point in the journey?", "What does your internal narrative about food and your body look like compared to month one?", "What's one thing about this journey that has been better than you expected?"] },
  { week: 10, prompts: ["What habits do you feel are genuinely durable — things that will continue after the medication?", "How do you want to feel about your relationship with food 12 months from now?", "What's the most honest thing you can say about how this journey has gone?"] },
  { week: 11, prompts: ["What are you most proud of about this journey so far?", "What's one thing you still want to work on?", "If you were writing a letter to yourself at week one, what would you say?"] },
  { week: 12, prompts: ["Looking back at your starting point, what has changed beyond the physical?", "What does a sustainable, enjoyable life around food and movement look like for you?", "What's one commitment you're making to yourself for the next 3 months?"] },
];

// ─── ONBOARDING ──────────────────────────────────────────
const OB_STEPS = [
  { id: "bmi", question: "What best describes your starting point?", sub: "Personalises your content and protein target.",
    options: [
      { value: "high", label: "Higher starting weight", desc: "BMI 35+ or significant weight to lose", icon: "◈" },
      { value: "mid", label: "Moderate starting weight", desc: "BMI 28–35", icon: "◇" },
      { value: "low", label: "Already relatively lean", desc: "Body composition and performance focus", icon: "◉" },
    ]},
  { id: "goal", question: "What is your primary goal?", sub: "This shapes the advice you receive at each stage.",
    options: [
      { value: "loss", label: "Weight loss", desc: "Reduce overall body weight", icon: "↓" },
      { value: "recomp", label: "Body recomposition", desc: "Lose fat, preserve or build muscle", icon: "⇄" },
      { value: "metabolic", label: "Metabolic health", desc: "Glucose, cardiovascular, or liver health", icon: "♡" },
      { value: "performance", label: "Performance & aesthetics", desc: "Optimise for training", icon: "◆" },
    ]},
  { id: "product", question: "What medication are you using?", sub: "Helps contextualise dosing and timing information.",
    options: [
      { value: "wegovy", label: "Wegovy (semaglutide)", desc: "FDA-approved for weight management", icon: "Rx" },
      { value: "ozempic", label: "Ozempic (semaglutide)", desc: "Off-label for weight loss", icon: "Rx" },
      { value: "mounjaro", label: "Mounjaro / Zepbound (tirzepatide)", desc: "Dual GLP-1/GIP mechanism", icon: "Rx" },
      { value: "compound", label: "Compounded semaglutide or tirzepatide", desc: "From a compounding pharmacy", icon: "⌬" },
      { value: "unsure", label: "Not sure yet", desc: "Still gathering information", icon: "?" },
    ]},
  { id: "weight", question: "What is your current weight? (lbs)", sub: "Used to calculate your personal protein target. Only you see this.", isNumeric: true },
  { id: "goal_weight", question: "What is your goal weight? (lbs)", sub: "Sets your protein target based on where you're heading.", isNumeric: true },
];

// ─── TABS ────────────────────────────────────────────────
const TABS = [
  { id: "journey",    label: "Journey",     icon: "◎", premium: false },
  { id: "protein",   label: "Protein",     icon: "⬡", premium: false },
  { id: "checkin",   label: "Check-In",    icon: "✓", premium: false },
  { id: "doses",     label: "Dose Log",    icon: "⊕", premium: false },
  { id: "reflect",   label: "Reflection",  icon: "◇", premium: false },
  { id: "costs",     label: "Cost Board",  icon: "$", premium: false },
];

// ─── MAIN APP ─────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState("onboard");
  const [obStep, setObStep] = useState(0);
  const [obAnswers, setObAnswers] = useState({});
  const [numInput, setNumInput] = useState("");
  const [track, setTrack] = useState(null);
  const [activeTab, setActiveTab] = useState("journey");
  const [activeStage, setActiveStage] = useState("pre");
  const [openSection, setOpenSection] = useState(null);
  const [openQ, setOpenQ] = useState(null);
  const [proteinTab, setProteinTab] = useState("animal");
  const [proteinFilter, setProteinFilter] = useState("all");
  const [checkIns, setCheckIns] = useState([]);
  const [currentCI, setCurrentCI] = useState({ nausea: 0, energy: 0, mood: 0, appetite: 0, sleep: 0, notes: "" });
  const [doses, setDoses] = useState([]);
  const [doseForm, setDoseForm] = useState({ date: today(), dose: "", product: "", site: "", notes: "" });
  const [costs, setCosts] = useState([
    { id: 1, pharmacy: "LifeMD", product: "Compounded Semaglutide", dose: "0.5mg/wk", price: 297, per: "month", state: "NY", rating: 4, notes: "Good support, quick turnaround", date: "Apr 2025" },
    { id: 2, pharmacy: "Hims & Hers", product: "Compounded Semaglutide", dose: "0.25mg/wk", price: 199, per: "month", state: "CA", rating: 4, notes: "Easy onboarding, responsive", date: "May 2025" },
  ]);
  const [costForm, setCostForm] = useState({ pharmacy: "", product: "", dose: "", price: "", per: "month", state: "", notes: "", rating: 5 });
  const [showCostForm, setShowCostForm] = useState(false);
  const [reflectWeek, setReflectWeek] = useState(1);
  const [reflections, setReflections] = useState({});
  const [currentReflect, setCurrentReflect] = useState({});
  const [ciSaved, setCiSaved] = useState(false);

  const proteinTarget = obAnswers.goal_weight
    ? Math.round((parseFloat(obAnswers.goal_weight) / 2.205) * 1.8)
    : obAnswers.weight
    ? Math.round((parseFloat(obAnswers.weight) / 2.205) * 1.6)
    : null;

  function handleObAnswer(val) {
    const q = OB_STEPS[obStep];
    const next = { ...obAnswers, [q.id]: val };
    setObAnswers(next);
    if (obStep < OB_STEPS.length - 1) {
      setNumInput("");
      setTimeout(() => setObStep(obStep + 1), 200);
    } else {
      setTrack(resolveTrack(next));
      setTimeout(() => setPhase("app"), 300);
    }
  }

  // Onboarding screen
  if (phase === "onboard") {
    const q = OB_STEPS[obStep];
    return (
      <div style={ob.shell}>
        <style>{fonts}</style>
        <div style={ob.card}>
          <div style={ob.top}>
            <div style={ob.logo}>J</div>
            <div style={{ display: "flex", gap: 5 }}>
              {OB_STEPS.map((_, i) => (
                <div key={i} style={{ height: 4, borderRadius: 2, background: i <= obStep ? T.teal : T.border, width: i === obStep ? 24 : 8, transition: "all 0.25s" }} />
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Step {obStep + 1} of {OB_STEPS.length}</div>
          <h2 style={ob.question}>{q.question}</h2>
          <p style={ob.sub}>{q.sub}</p>
          {q.isNumeric ? (
            <div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <input type="number" value={numInput} onChange={e => setNumInput(e.target.value)} onKeyDown={e => e.key === "Enter" && numInput && handleObAnswer(numInput)} placeholder="e.g. 210" style={ob.numInput} />
                <button onClick={() => numInput && handleObAnswer(numInput)} style={{ ...ob.nextBtn, opacity: numInput ? 1 : 0.4 }}>Next →</button>
              </div>
              <button onClick={() => handleObAnswer("")} style={ob.skipBtn}>Skip for now</button>
            </div>
          ) : (
            <div style={ob.options}>
              {q.options.map(opt => (
                <button key={opt.value} onClick={() => handleObAnswer(opt.value)}
                  style={{ ...ob.option, borderColor: obAnswers[q.id] === opt.value ? T.teal : T.border, background: obAnswers[q.id] === opt.value ? T.teal + "0C" : T.white }}>
                  <div style={{ ...ob.optIcon, background: obAnswers[q.id] === opt.value ? T.teal : T.light, color: obAnswers[q.id] === opt.value ? T.white : T.muted }}>{opt.icon}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {obAnswers[q.id] === opt.value && <span style={{ color: T.teal, fontSize: 16 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 16 }}>Your answers personalise the content. Update anytime from settings.</p>
      </div>
    );
  }

  const trackMeta = TRACKS[track] || TRACK_META.mid_loss;
  const stageData = CONTENT[activeStage];
  const stageCol = stageData.color;
  const allSections = [
    ...stageData.universal,
    ...(stageData.byTrack[track] || [])
  ];
  const totalQ = allSections.reduce((n, s) => n + s.questions.length, 0);
  const personalised = (stageData.byTrack[track] || []).reduce((n, s) => n + s.questions.length, 0);

  // ── Main App UI ───────────────────────────────────────
  return (
    <div style={s.shell}>
      <style>{fonts}</style>

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.bMark}>J</div>
          <div>
            <div style={s.bName}>GLP-1 Journey</div>
            <div style={s.bSub}>Your personal guide</div>
          </div>
        </div>

        {/* Track badge */}
        <div style={{ padding: "8px 14px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 7, border: `1px solid ${trackMeta.color}40`, background: trackMeta.color + "0E", color: trackMeta.color }}>
            <span style={{ fontSize: 14 }}>{trackMeta.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{trackMeta.label}</span>
          </div>
        </div>

        {/* Protein target */}
        {proteinTarget && (
          <div style={{ margin: "6px 14px 4px", background: T.teal + "0C", borderRadius: 8, padding: "8px 12px", border: `1px solid ${T.teal}25` }}>
            <div style={{ fontSize: 10, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Daily Protein Target</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.navy, fontFamily: "'Cormorant Garamond', serif" }}>{proteinTarget}g</div>
            <div style={{ fontSize: 10, color: T.muted }}>≈ {Math.round(proteinTarget / 3)}g per meal</div>
          </div>
        )}

        {/* Nav */}
        <div style={s.nav}>
          <div style={s.navLabel}>Features</div>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ ...s.navItem, background: activeTab === tab.id ? T.teal + "12" : "transparent", borderLeft: `3px solid ${activeTab === tab.id ? T.teal : "transparent"}`, color: activeTab === tab.id ? T.teal : "#666" }}>
              <span style={{ fontSize: 13, marginRight: 8, flexShrink: 0 }}>{tab.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        <button onClick={() => { setPhase("onboard"); setObStep(0); setObAnswers({}); setTrack(null); }}
          style={{ margin: "4px 12px 16px", padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", fontSize: 11, color: "#999", cursor: "pointer", fontFamily: "inherit" }}>
          ↩ Update my profile
        </button>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* ── JOURNEY TAB ── */}
        {activeTab === "journey" && (
          <div>
            {/* Stage tabs */}
            <div style={{ background: T.white, padding: "16px 28px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
                {STAGE_ORDER.map(id => {
                  const st = CONTENT[id];
                  const active = activeStage === id;
                  return (
                    <button key={id} onClick={() => { setActiveStage(id); setOpenSection(null); setOpenQ(null); }}
                      style={{ flexShrink: 0, padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", borderBottom: `3px solid ${active ? st.color : "transparent"}`, color: active ? st.color : "#888", fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                      {st.icon} {st.week}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage header */}
            <div style={{ background: T.white, padding: "20px 28px 16px", borderBottom: `3px solid ${stageCol}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: T.navy, marginBottom: 4 }}>{stageData.label}</h1>
                  <p style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>{stageData.tagline}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ padding: "3px 10px", background: stageCol + "14", borderRadius: 4, fontSize: 11, color: stageCol, fontWeight: 600 }}>{totalQ} questions</span>
                    {personalised > 0 && <span style={{ padding: "3px 10px", background: trackMeta.color + "14", borderRadius: 4, fontSize: 11, color: trackMeta.color, fontWeight: 600 }}>{personalised} personalised for your track</span>}
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: stageCol + "14", color: stageCol, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{stageData.icon}</div>
              </div>
            </div>

            {/* Sections */}
            <div style={{ padding: "18px 28px", display: "flex", flexDirection: "column", gap: 9 }}>
              {allSections.map((sec, si) => {
                const isPersonalised = si >= stageData.universal.length;
                const sKey = `${activeStage}-${si}`;
                const isOpen = openSection === sKey;
                return (
                  <div key={si} style={{ borderRadius: 10, border: `1px solid ${T.border}`, background: T.white, overflow: "hidden" }}>
                    <button onClick={() => setOpenSection(isOpen ? null : sKey)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", border: "none", background: isOpen ? stageCol + "08" : "#fafafa", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: isPersonalised ? trackMeta.color : stageCol, color: T.white, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{si + 1}</div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isOpen ? stageCol : T.navy }}>{sec.title}</div>
                          {isPersonalised && <div style={{ fontSize: 10, color: trackMeta.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 1 }}>Personalised for your track</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: "#bbb" }}>{sec.questions.length}</span>
                        <span style={{ color: stageCol, fontSize: 13, display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "6px 12px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
                        {sec.questions.map((item, qi) => {
                          const qKey = `${sKey}-${qi}`;
                          const qOpen = openQ === qKey;
                          return (
                            <div key={qi} style={{ borderRadius: 8, background: "#fafafa", borderLeft: `3px solid ${qOpen ? stageCol : "#eee"}`, transition: "border-color 0.2s" }}>
                              <button onClick={() => setOpenQ(qOpen ? null : qKey)}
                                style={{ width: "100%", background: "none", border: "none", padding: "11px 13px", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left" }}>
                                <span style={{ color: stageCol, fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>Q</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: qOpen ? T.navy : "#333", lineHeight: 1.4, flex: 1 }}>{item.q}</span>
                                <span style={{ color: "#ccc", fontSize: 12, flexShrink: 0, marginTop: 2 }}>{qOpen ? "−" : "+"}</span>
                              </button>
                              {qOpen && (
                                <div style={{ display: "flex", gap: 9, padding: "0 13px 13px", borderTop: `1px solid #eee` }}>
                                  <span style={{ color: stageCol, fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 13 }}>A</span>
                                  <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8, paddingTop: 13, margin: 0 }}>{item.a}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PROTEIN TAB ── */}
        {activeTab === "protein" && (
          <div>
            <div style={{ background: T.white, padding: "20px 28px 0", borderBottom: `1px solid ${T.border}` }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: T.navy, marginBottom: 4 }}>Protein Guide</h1>
              <p style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>Your appetite is suppressed but your protein requirement is not. Here's how to hit your target when you can barely eat.</p>
              {proteinTarget && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: T.teal + "0E", border: `1px solid ${T.teal}28`, borderRadius: 8, padding: "7px 14px", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: T.teal, fontWeight: 700 }}>Your target: {proteinTarget}g/day</span>
                  <span style={{ fontSize: 12, color: T.muted }}>≈ {Math.round(proteinTarget / 3)}g per meal × 3</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 0 }}>
                {[["animal", "🥩 Animal-Based"], ["plant", "🌱 Plant-Based"], ["avoid", "⚠️ What to Avoid"]].map(([val, label]) => (
                  <button key={val} onClick={() => setProteinTab(val)}
                    style={{ padding: "9px 16px", border: "none", background: "transparent", cursor: "pointer", borderBottom: `3px solid ${proteinTab === val ? (val === "avoid" ? T.rose : T.teal) : "transparent"}`, color: proteinTab === val ? (val === "avoid" ? T.rose : T.teal) : "#888", fontSize: 12, fontWeight: proteinTab === val ? 700 : 400, fontFamily: "inherit" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: "16px 28px" }}>
              {proteinTab !== "avoid" && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[["all", "All"], ["top", "Best Options (★★★★+)"]].map(([val, label]) => (
                    <button key={val} onClick={() => setProteinFilter(val)}
                      style={{ padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${proteinFilter === val ? T.teal : T.border}`, background: proteinFilter === val ? T.teal : T.white, color: proteinFilter === val ? T.white : "#666", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {proteinTab === "avoid" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {PROTEIN.avoid.map((item, i) => (
                    <div key={i} style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.rose}`, padding: "13px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.rose, marginBottom: 4 }}>⚠ {item.name}</div>
                      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>{item.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                    {PROTEIN[proteinTab].filter(item => proteinFilter === "all" || item.rating >= 4).map((item, i) => (
                      <div key={i} style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, flex: 1, lineHeight: 1.3 }}>{item.name}</div>
                          <div style={{ display: "flex", gap: 1, marginLeft: 8, flexShrink: 0 }}>
                            {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 10, color: n <= item.rating ? T.amber : "#ddd" }}>★</span>)}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
                          <div><div style={{ fontSize: 20, fontWeight: 700, color: T.teal, fontFamily: "'Cormorant Garamond', serif" }}>{item.protein}g</div><div style={{ fontSize: 10, color: "#aaa" }}>protein</div></div>
                          <div><div style={{ fontSize: 16, fontWeight: 600, color: "#666" }}>{item.cal}</div><div style={{ fontSize: 10, color: "#aaa" }}>calories</div></div>
                          <div style={{ fontSize: 11, color: "#999", fontStyle: "italic", alignSelf: "flex-end", paddingBottom: 2 }}>per {item.serve}</div>
                        </div>
                        <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, margin: 0 }}>{item.notes}</p>
                      </div>
                    ))}
                  </div>
                  {/* Sample day */}
                  <div style={{ marginTop: 20, background: T.teal + "07", border: `1px solid ${T.teal}20`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Sample Day — Hitting {proteinTarget || 120}g on a Suppressed Appetite</div>
                    {[
                      { time: "Breakfast", meal: "Greek yoghurt (200g) + 1 scoop whey blended in", protein: 41 },
                      { time: "Lunch", meal: "95g tin salmon + small salad", protein: 25 },
                      { time: "Snack", meal: "Cottage cheese (100g) + edamame (half cup)", protein: 21 },
                      { time: "Dinner", meal: "100g chicken mince in broth with soft vegetables", protein: 27 },
                      { time: "Evening", meal: "Casein shake if needed to hit target", protein: 24 },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                        <div style={{ width: 65, fontSize: 11, fontWeight: 700, color: T.teal, flexShrink: 0 }}>{row.time}</div>
                        <div style={{ flex: 1, fontSize: 12, color: "#444" }}>{row.meal}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, flexShrink: 0 }}>{row.protein}g</div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>Total: 138g ✓</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── CHECK-IN TAB ── */}
        {activeTab === "checkin" && (
          <div style={{ padding: "22px 28px" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: T.navy, marginBottom: 4 }}>Weekly Check-In</h1>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Rate how you're feeling this week. Tracked over time to show your progress and flag what's normal for your stage.</p>
            <div style={{ background: T.white, borderRadius: 13, border: `1px solid ${T.border}`, padding: "20px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>This week — {today()}</div>
              {[
                { key: "nausea", label: "Nausea", lo: "Severe", hi: "None" },
                { key: "energy", label: "Energy", lo: "Exhausted", hi: "High" },
                { key: "mood", label: "Mood", lo: "Low", hi: "Great" },
                { key: "appetite", label: "Appetite", lo: "Suppressed", hi: "Normal" },
                { key: "sleep", label: "Sleep", lo: "Poor", hi: "Great" },
              ].map(m => (
                <div key={m.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: "#bbb" }}>{m.lo} ← → {m.hi}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setCurrentCI({ ...currentCI, [m.key]: n })}
                        style={{ flex: 1, height: 36, borderRadius: 7, border: `2px solid ${currentCI[m.key] === n ? T.teal : T.border}`, background: currentCI[m.key] === n ? T.teal : "#fafafa", color: currentCI[m.key] === n ? T.white : "#999", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <textarea value={currentCI.notes} onChange={e => setCurrentCI({ ...currentCI, notes: e.target.value })}
                placeholder="Notes this week — symptoms, wins, questions for your doctor..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "inherit", resize: "vertical", minHeight: 70, color: T.navy, boxSizing: "border-box" }} />
              <button onClick={() => {
                setCheckIns([...checkIns, { ...currentCI, date: today(), week: checkIns.length + 1 }]);
                setCurrentCI({ nausea: 0, energy: 0, mood: 0, appetite: 0, sleep: 0, notes: "" });
                setCiSaved(true); setTimeout(() => setCiSaved(false), 2500);
              }} style={{ marginTop: 12, width: "100%", padding: "12px", background: T.teal, color: T.white, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {ciSaved ? "✓ Saved!" : "Save Check-In"}
              </button>
            </div>
            {checkIns.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>History</div>
                {[...checkIns].reverse().map((ci, i) => (
                  <div key={i} style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: "13px 16px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Week {ci.week}</span>
                      <span style={{ fontSize: 12, color: "#aaa" }}>{ci.date}</span>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {["nausea","energy","mood","appetite","sleep"].map(k => (
                        <div key={k} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: T.teal }}>{ci[k]}/5</div>
                          <div style={{ fontSize: 10, color: "#aaa", textTransform: "capitalize" }}>{k}</div>
                        </div>
                      ))}
                    </div>
                    {ci.notes && <p style={{ fontSize: 12, color: "#666", marginTop: 8, fontStyle: "italic", borderTop: `1px solid ${T.border}`, paddingTop: 8, margin: "8px 0 0" }}>{ci.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DOSE LOG TAB ── */}
        {activeTab === "doses" && (
          <div style={{ padding: "22px 28px" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: T.navy, marginBottom: 4 }}>Dose Log</h1>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Track every injection. Your log is a valuable record for your prescriber and helps identify side effect patterns.</p>
            <div style={{ background: T.white, borderRadius: 13, border: `1px solid ${T.border}`, padding: "18px", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><label style={s.label}>Date</label><input type="date" value={doseForm.date} onChange={e => setDoseForm({ ...doseForm, date: e.target.value })} style={s.input} /></div>
                <div><label style={s.label}>Dose (mg)</label><input type="number" step="0.1" value={doseForm.dose} onChange={e => setDoseForm({ ...doseForm, dose: e.target.value })} placeholder="e.g. 0.5" style={s.input} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><label style={s.label}>Product</label><input value={doseForm.product} onChange={e => setDoseForm({ ...doseForm, product: e.target.value })} placeholder="e.g. Wegovy" style={s.input} /></div>
                <div><label style={s.label}>Injection site</label>
                  <select value={doseForm.site} onChange={e => setDoseForm({ ...doseForm, site: e.target.value })} style={{ ...s.input, cursor: "pointer" }}>
                    <option value="">Select site...</option>
                    {["Abdomen (left)","Abdomen (right)","Outer thigh (left)","Outer thigh (right)","Upper arm (left)","Upper arm (right)"].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={s.label}>Notes</label><input value={doseForm.notes} onChange={e => setDoseForm({ ...doseForm, notes: e.target.value })} placeholder="Any reactions, timing, or observations..." style={s.input} /></div>
              <button onClick={() => {
                if (!doseForm.date || !doseForm.dose) return;
                setDoses([{ ...doseForm, id: Date.now() }, ...doses]);
                setDoseForm({ date: today(), dose: "", product: "", site: "", notes: "" });
              }} style={{ width: "100%", padding: "12px", background: T.teal, color: T.white, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Add to Log
              </button>
            </div>
            {doses.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {doses.map(d => (
                  <div key={d.id} style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ textAlign: "center", background: T.teal + "0E", borderRadius: 8, padding: "6px 10px", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily: "'Cormorant Garamond', serif" }}>{d.dose}</div>
                      <div style={{ fontSize: 10, color: "#aaa" }}>mg</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{d.product || "GLP-1"}{d.site ? ` · ${d.site}` : ""}</div>
                      <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>{d.date}</div>
                      {d.notes && <div style={{ fontSize: 12, color: "#777", marginTop: 3, fontStyle: "italic" }}>{d.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REFLECTION TAB ── */}
        {activeTab === "reflect" && (
          <div style={{ padding: "22px 28px" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: T.navy, marginBottom: 4 }}>Weekly Reflection</h1>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>The physical journey and the psychological journey are not the same timeline. These prompts help you process both.</p>

            {/* Week selector */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {REFLECTIONS.map(r => (
                <button key={r.week} onClick={() => { setReflectWeek(r.week); setCurrentReflect(reflections[r.week] || {}); }}
                  style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${reflectWeek === r.week ? T.violet : T.border}`, background: reflectWeek === r.week ? T.violet : T.white, color: reflectWeek === r.week ? T.white : "#666", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: reflections[r.week] ? 700 : 400 }}>
                  Week {r.week} {reflections[r.week] ? "✓" : ""}
                </button>
              ))}
            </div>

            {/* Current week prompts */}
            {(() => {
              const wr = REFLECTIONS.find(r => r.week === reflectWeek);
              return (
                <div style={{ background: T.white, borderRadius: 13, border: `1px solid ${T.border}`, padding: "20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.violet, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>Week {reflectWeek} · Reflection Prompts</div>
                  {wr.prompts.map((prompt, pi) => (
                    <div key={pi} style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8, lineHeight: 1.4 }}>{prompt}</label>
                      <textarea
                        value={currentReflect[pi] || ""}
                        onChange={e => setCurrentReflect({ ...currentReflect, [pi]: e.target.value })}
                        placeholder="Write as much or as little as feels right..."
                        rows={3}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "inherit", resize: "vertical", color: T.navy, boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                  <button onClick={() => { setReflections({ ...reflections, [reflectWeek]: currentReflect }); }}
                    style={{ width: "100%", padding: "12px", background: T.violet, color: T.white, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Save Reflection
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── COSTS TAB ── */}
        {activeTab === "costs" && (
          <div style={{ padding: "22px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: T.navy }}>Medication Cost Board</h1>
              <button onClick={() => setShowCostForm(!showCostForm)}
                style={{ padding: "8px 16px", background: T.teal, color: T.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                + Share My Cost
              </button>
            </div>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Real prices from real users. Help others know what to expect.</p>
            <p style={{ fontSize: 11, color: "#bbb", marginBottom: 18, fontStyle: "italic" }}>Community-submitted. This app does not verify or endorse any pharmacy listed. Always confirm accreditation independently.</p>

            {showCostForm && (
              <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.border}`, padding: "18px", marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div><label style={s.label}>Pharmacy / Provider *</label><input value={costForm.pharmacy} onChange={e => setCostForm({ ...costForm, pharmacy: e.target.value })} placeholder="e.g. LifeMD" style={s.input} /></div>
                  <div><label style={s.label}>Product *</label><input value={costForm.product} onChange={e => setCostForm({ ...costForm, product: e.target.value })} placeholder="e.g. Compounded Semaglutide" style={s.input} /></div>
                  <div><label style={s.label}>Dose</label><input value={costForm.dose} onChange={e => setCostForm({ ...costForm, dose: e.target.value })} placeholder="e.g. 0.5mg/week" style={s.input} /></div>
                  <div><label style={s.label}>Price (USD) *</label><input type="number" value={costForm.price} onChange={e => setCostForm({ ...costForm, price: e.target.value })} placeholder="e.g. 299" style={s.input} /></div>
                  <div><label style={s.label}>Per</label>
                    <select value={costForm.per} onChange={e => setCostForm({ ...costForm, per: e.target.value })} style={{ ...s.input, cursor: "pointer" }}>
                      {["week","month","vial","pen"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div><label style={s.label}>State</label>
                    <select value={costForm.state} onChange={e => setCostForm({ ...costForm, state: e.target.value })} style={{ ...s.input, cursor: "pointer" }}>
                      <option value="">Select...</option>
                      {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(st => <option key={st}>{st}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={s.label}>Your Rating</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1,2,3,4,5].map(n => <button key={n} onClick={() => setCostForm({ ...costForm, rating: n })} style={{ width: 34, height: 34, borderRadius: 7, border: `2px solid ${costForm.rating >= n ? T.amber : T.border}`, background: costForm.rating >= n ? T.amber + "18" : "#fafafa", fontSize: 15, cursor: "pointer", color: costForm.rating >= n ? T.amber : "#ccc" }}>★</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}><label style={s.label}>Notes</label><input value={costForm.notes} onChange={e => setCostForm({ ...costForm, notes: e.target.value })} placeholder="Quality, service, delivery speed..." style={s.input} /></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => {
                    if (!costForm.pharmacy || !costForm.product || !costForm.price) return;
                    setCosts([{ ...costForm, id: Date.now(), date: today() }, ...costs]);
                    setCostForm({ pharmacy: "", product: "", dose: "", price: "", per: "month", state: "", notes: "", rating: 5 });
                    setShowCostForm(false);
                  }} style={{ flex: 1, padding: "11px", background: T.teal, color: T.white, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Submit</button>
                  <button onClick={() => setShowCostForm(false)} style={{ padding: "11px 18px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, cursor: "pointer", color: "#666", fontFamily: "inherit" }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {costs.map(c => (
                <div key={c.id} style={{ background: T.white, borderRadius: 11, border: `1px solid ${T.border}`, padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{c.pharmacy}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{c.product}{c.dose ? ` · ${c.dose}` : ""}{c.state ? ` · ${c.state}` : ""}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.teal, fontFamily: "'Cormorant Garamond', serif" }}>${c.price}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>per {c.per}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 1 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 12, color: n <= c.rating ? T.amber : "#ddd" }}>★</span>)}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{c.date}</div>
                  </div>
                  {c.notes && <p style={{ fontSize: 12, color: "#666", marginTop: 8, fontStyle: "italic", borderTop: `1px solid ${T.border}`, paddingTop: 8, margin: "8px 0 0" }}>{c.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────
const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Jost:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  button { font-family: 'Jost', sans-serif; }
  body { font-family: 'Jost', sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
`;

const s = {
  shell: { display: "flex", minHeight: "100vh", fontFamily: "'Jost', sans-serif", background: "#F2EDE6" },
  sidebar: { width: 226, flexShrink: 0, background: T.white, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" },
  brand: { display: "flex", alignItems: "center", gap: 10, padding: "18px 14px 12px", borderBottom: `1px solid ${T.border}` },
  bMark: { width: 32, height: 32, borderRadius: 9, background: T.navy, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, flexShrink: 0 },
  bName: { fontSize: 13, fontWeight: 700, color: T.navy },
  bSub: { fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 1 },
  nav: { padding: "8px 10px", flex: 1 },
  navLabel: { fontSize: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: 1.5, padding: "8px 6px 5px" },
  navItem: { width: "100%", display: "flex", alignItems: "center", padding: "8px 7px", borderRadius: 7, border: "none", cursor: "pointer", marginBottom: 2, transition: "all 0.15s", background: "transparent" },
  main: { flex: 1, overflowY: "auto", minWidth: 0 },
  label: { display: "block", fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "'Jost', sans-serif", color: T.navy, background: "#fafafa", boxSizing: "border-box" },
};

const ob = {
  shell: { minHeight: "100vh", background: `linear-gradient(135deg, ${T.navy} 0%, #1A3040 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "'Jost', sans-serif" },
  card: { background: T.white, borderRadius: 20, width: "100%", maxWidth: 480, padding: "30px 34px", boxShadow: "0 24px 64px rgba(0,0,0,0.28)" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  logo: { width: 36, height: 36, borderRadius: 10, background: T.navy, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 700 },
  question: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: T.navy, lineHeight: 1.3, marginBottom: 6 },
  sub: { fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.5 },
  options: { display: "flex", flexDirection: "column", gap: 8 },
  option: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "1.5px solid", cursor: "pointer", transition: "all 0.15s", width: "100%", textAlign: "left" },
  optIcon: { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, transition: "all 0.18s" },
  numInput: { flex: 1, padding: "11px 13px", borderRadius: 9, border: `1.5px solid ${T.border}`, fontSize: 16, fontFamily: "'Jost', sans-serif", color: T.navy, outline: "none" },
  nextBtn: { padding: "11px 20px", background: T.teal, color: T.white, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "opacity 0.2s" },
  skipBtn: { display: "block", marginTop: 11, background: "none", border: "none", color: "#aaa", fontSize: 12, cursor: "pointer", fontFamily: "'Jost', sans-serif" },
};

// Fix missing reference
const TRACKS = TRACK_META;
