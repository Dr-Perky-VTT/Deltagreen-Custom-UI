// home-scene-manager.js

// IDs to use in UI / calls
export const HOME_PURSUIT_IDS = {
  FULFILL_RESPONSIBILITIES: "fulfillResponsibilities",
  BACK_TO_NATURE: "backToNature",
  ESTABLISH_NEW_BOND: "establishNewBond",
  THERAPY_TRUTHFUL: "therapyTruthful",
  THERAPY_NOT_TRUTHFUL: "therapyNotTruthful",
  IMPROVE_SKILLS_OR_STATS: "improveSkillsOrStats",
  INDULGE_MOTIVATION: "indulgeMotivation",
  SPECIAL_TRAINING: "specialTraining",
  STAY_ON_THE_CASE: "stayOnTheCase",
  STUDY_UNNATURAL: "studyUnnatural"
};

export const ROLL_RESULTS = {
  FUMBLE: "fumble",
  FAILURE: "failure",
  SUCCESS: "success",
  CRITICAL: "critical"
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollFormula(formula) {
  // very small subset: "1d4", "1d6", "3d6", etc.
  const m = formula.match(/^(\d+)d(\d+)$/i);
  if (!m) throw new Error("Unsupported formula: " + formula);
  const count = Number(m[1]);
  const sides = Number(m[2]);
  let total = 0;
  const rolls = [];
  for (let i = 0; i < count; i++) {
    const r = rollDie(sides);
    rolls.push(r);
    total += r;
  }
  return { total: total, rolls: rolls };
}

function determineRollResult(d100, target) {
  // Basic DG-style: critical/fumble on doubles, else success/failure by target
  const isDouble = d100 % 11 === 0 && d100 !== 0; // 11,22,...,99
  const success = d100 <= target;

  if (isDouble && success) return ROLL_RESULTS.CRITICAL;
  if (isDouble && !success) return ROLL_RESULTS.FUMBLE;
  if (success) return ROLL_RESULTS.SUCCESS;
  return ROLL_RESULTS.FAILURE;
}

function clampSan(san, pow) {
  const maxSan = pow != null ? pow * 5 : san;
  if (maxSan == null) return san;
  if (san < 0) san = 0;
  if (san > maxSan) san = maxSan;
  return san;
}

function clampBond(bond, cha) {
  const maxBond = cha != null ? cha : bond;
  if (maxBond == null) return bond;
  if (bond < 0) bond = 0;
  if (bond > maxBond) bond = maxBond;
  return bond;
}

/**
 * ctx:
 *  - san: current SAN
 *  - pow: POW (for SAN cap)
 *  - cha: CHA (for Bond caps / new bonds)
 *
 *  - primaryBondValue: the Bond that takes cost/effect (number)
 *  - primaryBondLabel: string (e.g. "Spouse") – for log only
 *
 *  - costBondValue: if you want a different Bond to pay the cost
 *  - costBondLabel: label for that Bond
 *
 *  - therapistBondValue: existing Bond score with therapist (optional)
 *  - therapistBondLabel: label (defaults to "Therapist")
 *
 *  - rollTargetOverride: number – if you want to override the default target %
 *  - preRolledD100: number 1–100 – if you already rolled and just want math
 *
 *  - increases: for IMPROVE_SKILLS_OR_STATS, how many increases were chosen
 *  - improveTargets: for IMPROVE_SKILLS_OR_STATS:
 *        [ {
 *            id,           // "sys:firearms" or "item:<itemId>"
 *            key,          // system skill key OR item id
 *            name,         // label for logs
 *            isSkill,      // true if skill, false if stat
 *            kind,         // "system" or "item"
 *            rollTarget,   // current value used as % target
 *            preRolledD100 // optional – otherwise we roll here
 *          }, ... ]
 *
 *  - newBondLabel: optional name for a newly created Bond
 */
export class HomeSceneManager {
  static runPursuit(pursuitId, ctx) {
    if (!ctx) ctx = {};

    const notes = [];
    const detailLines = [];

    let san = ctx.san != null ? ctx.san : 0;
    const pow = ctx.pow != null ? ctx.pow : null;
    const cha = ctx.cha != null ? ctx.cha : null;

    let primaryBond = ctx.primaryBondValue != null ? ctx.primaryBondValue : null;
    const primaryBondLabel = ctx.primaryBondLabel || "Bond";

    let costBond = ctx.costBondValue != null ? ctx.costBondValue : primaryBond;
    const costBondLabel = ctx.costBondLabel || primaryBondLabel || "Bond";

    let therapistBond = ctx.therapistBondValue != null ? ctx.therapistBondValue : null;
    const therapistBondLabel = ctx.therapistBondLabel || "Therapist";

    const sanBefore = san;
    const bondsBefore = {
      primary: primaryBond,
      cost: costBond,
      therapist: therapistBond
    };

    let roll = ctx.preRolledD100 != null ? ctx.preRolledD100 : null;
    let rollTarget = ctx.rollTargetOverride != null ? ctx.rollTargetOverride : null;
    let outcome = null;
    let improveResults = [];
    let newBondValue = null;
    let newBondLabel = ctx.newBondLabel != null ? ctx.newBondLabel : null;
    let newTherapistBondValue = null;
    let clueQuality = null;

    // Ensure we have a d100 + outcome for % rolls
    function ensurePercentileRoll(defaultTarget) {
      if (rollTarget == null) rollTarget = defaultTarget;
      if (roll == null) roll = rollDie(100);
      outcome = determineRollResult(roll, rollTarget);
    }

    // -----------------------------------------------------------------------
    // Per-pursuit handling
    // -----------------------------------------------------------------------
    switch (pursuitId) {
      case HOME_PURSUIT_IDS.FULFILL_RESPONSIBILITIES: {
        if (rollTarget == null) rollTarget = san;
        ensurePercentileRoll(rollTarget);

        detailLines.push(
          "Pursuit: Fulfill responsibilities",
          "Roll: " + roll + " vs " + rollTarget + " → " + outcome.toUpperCase()
        );

        if (primaryBond == null) {
          notes.push(
            "No primaryBondValue provided; Bond changes must be applied manually."
          );
        }

        if (outcome === ROLL_RESULTS.FUMBLE) {
          const loss = rollFormula("1d4").total;
          if (primaryBond != null) {
            primaryBond -= loss;
            primaryBond = clampBond(primaryBond, cha);
            detailLines.push(primaryBondLabel + " Bond -" + loss + " (1d4).");
          }
          san -= 1;
          san = clampSan(san, pow);
          detailLines.push("SAN -1.");
        } else if (outcome === ROLL_RESULTS.FAILURE) {
          if (primaryBond != null) {
            primaryBond += 1;
            primaryBond = clampBond(primaryBond, cha);
            detailLines.push(primaryBondLabel + " Bond +1.");
          }
        } else if (outcome === ROLL_RESULTS.SUCCESS) {
          if (primaryBond != null) {
            const gain = rollFormula("1d6").total;
            primaryBond += gain;
            primaryBond = clampBond(primaryBond, cha);
            detailLines.push(primaryBondLabel + " Bond +" + gain + " (1d6).");
          }
        } else if (outcome === ROLL_RESULTS.CRITICAL) {
          if (primaryBond != null) {
            const gain = rollFormula("1d6").total;
            primaryBond += gain;
            primaryBond = clampBond(primaryBond, cha);
            detailLines.push(primaryBondLabel + " Bond +" + gain + " (1d6).");
          }
          san += 1;
          san = clampSan(san, pow);
          detailLines.push("SAN +1.");
        }
        break;
      }

      case HOME_PURSUIT_IDS.BACK_TO_NATURE: {
        // Cost: reduce a non-DG Bond by 1.
        if (costBond != null) {
          costBond -= 1;
          costBond = clampBond(costBond, cha);
          detailLines.push(costBondLabel + " Bond -1 (time away).");
        } else {
          notes.push("Back to nature requires a non-DG Bond to reduce by 1.");
        }

        if (rollTarget == null) rollTarget = san;
        ensurePercentileRoll(rollTarget);

        detailLines.push(
          "Pursuit: Back to nature",
          "Roll: " + roll + " vs " + rollTarget + " → " + outcome.toUpperCase()
        );

        if (outcome === ROLL_RESULTS.FUMBLE) {
          const loss = rollFormula("1d4").total;
          san -= loss;
          san = clampSan(san, pow);
          detailLines.push("Fumble: lose " + loss + " SAN (1d4).");
        } else if (outcome === ROLL_RESULTS.FAILURE) {
          san += 1;
          san = clampSan(san, pow);
          detailLines.push("Failure: gain 1 SAN.");
        } else if (outcome === ROLL_RESULTS.SUCCESS) {
          const gain = rollFormula("1d4").total;
          san += gain;
          san = clampSan(san, pow);
          detailLines.push("Success: gain " + gain + " SAN (1d4).");
        } else if (outcome === ROLL_RESULTS.CRITICAL) {
          san += 4;
          san = clampSan(san, pow);
          detailLines.push("Critical: gain 4 SAN.");
        }
        break;
      }

      case HOME_PURSUIT_IDS.ESTABLISH_NEW_BOND: {
        if (costBond != null) {
          costBond -= 1;
          costBond = clampBond(costBond, cha);
          detailLines.push(costBondLabel + " Bond -1 (neglect).");
        } else {
          notes.push(
            "Establish a new Bond requires a non-DG Bond to reduce by 1."
          );
        }

        const target = cha != null ? cha * 5 : (rollTarget != null ? rollTarget : 0);
        ensurePercentileRoll(target);

        detailLines.push(
          "Pursuit: Establish a new Bond",
          "Roll: " + roll + " vs " + target + " → " + outcome.toUpperCase()
        );

        if (outcome === ROLL_RESULTS.SUCCESS ||
            outcome === ROLL_RESULTS.CRITICAL) {
          if (cha != null) {
            newBondValue = clampBond(Math.floor(cha / 2), cha);
            detailLines.push(
              "Gain a new Bond at " + newBondValue + " (1/2 CHA)."
            );
          } else {
            notes.push("CHA not provided; record new Bond at 1/2 CHA manually.");
          }
        } else {
          detailLines.push("Failure: no new Bond gained.");
        }
        break;
      }

      case HOME_PURSUIT_IDS.THERAPY_TRUTHFUL: {
        if (costBond != null) {
          costBond -= 1;
          costBond = clampBond(costBond, cha);
          detailLines.push(
            costBondLabel + " Bond -1 (time spent in therapy)."
          );
        } else {
          notes.push("Therapy requires a non-DG Bond to reduce by 1.");
        }

        const defaultTarget = rollTarget != null ? rollTarget : 50;
        ensurePercentileRoll(defaultTarget);

        detailLines.push(
          "Pursuit: Therapy (sharing truthfully)",
          "Roll: " + roll + " vs " + rollTarget + " → " + outcome.toUpperCase()
        );

        if (outcome === ROLL_RESULTS.FUMBLE) {
          san -= 1;
          san = clampSan(san, pow);
          detailLines.push("Fumble: lose 1 SAN.");
        } else if (outcome === ROLL_RESULTS.FAILURE) {
          san += 1;
          san = clampSan(san, pow);
          detailLines.push("Failure: gain 1 SAN.");
        } else if (outcome === ROLL_RESULTS.SUCCESS) {
          const gain = rollFormula("1d6").total;
          san += gain;
          san = clampSan(san, pow);
          detailLines.push("Success: gain " + gain + " SAN (1d6).");
        } else if (outcome === ROLL_RESULTS.CRITICAL) {
          san += 6;
          san = clampSan(san, pow);
          detailLines.push(
            "Critical: gain 6 SAN; one disorder goes into remission."
          );

          if (therapistBond != null) {
            const bump = rollFormula("1d4").total;
            therapistBond += bump;
            therapistBond = clampBond(therapistBond, cha);
            detailLines.push(
              therapistBondLabel + " Bond +" + bump + " (1d4) instead of a new Bond."
            );
          } else if (cha != null) {
            newTherapistBondValue = clampBond(Math.floor(cha / 2), cha);
            detailLines.push(
              "Gain a new Bond with " + therapistBondLabel +
              " at " + newTherapistBondValue + " (1/2 CHA)."
            );
          } else {
            notes.push(
              "CHA not provided; handler should record new therapist Bond at 1/2 CHA manually."
            );
          }
        }

        notes.push(
          "Remember the -20% penalty if the therapist believes the stories are delusions; " +
          "if they do not, there is a risk of investigation or further exposure."
        );
        break;
      }

      case HOME_PURSUIT_IDS.THERAPY_NOT_TRUTHFUL: {
        if (costBond != null) {
          costBond -= 1;
          costBond = clampBond(costBond, cha);
          detailLines.push(
            costBondLabel + " Bond -1 (time spent in therapy)."
          );
        } else {
          notes.push("Therapy requires a non-DG Bond to reduce by 1.");
        }

        const defaultTarget = rollTarget != null ? rollTarget : 50;
        ensurePercentileRoll(defaultTarget);

        detailLines.push(
          "Pursuit: Therapy (not sharing truthfully)",
          "Roll: " + roll + " vs " + rollTarget + " → " + outcome.toUpperCase()
        );

        if (outcome === ROLL_RESULTS.FUMBLE) {
          san -= 1;
          san = clampSan(san, pow);
          detailLines.push("Fumble: lose 1 SAN.");
        } else if (outcome === ROLL_RESULTS.FAILURE) {
          detailLines.push("Failure: no change in SAN.");
        } else if (outcome === ROLL_RESULTS.SUCCESS) {
          const gain = rollFormula("1d4").total;
          san += gain;
          san = clampSan(san, pow);
          detailLines.push("Success: gain " + gain + " SAN (1d4).");
        } else if (outcome === ROLL_RESULTS.CRITICAL) {
          san += 4;
          san = clampSan(san, pow);
          detailLines.push(
            "Critical: gain 4 SAN; a disorder goes into remission."
          );

          if (therapistBond != null) {
            const bump = rollFormula("1d4").total;
            therapistBond += bump;
            therapistBond = clampBond(therapistBond, cha);
            detailLines.push(
              therapistBondLabel + " Bond +" + bump + " (1d4) instead of a new Bond."
            );
          } else if (cha != null) {
            newTherapistBondValue = clampBond(Math.floor(cha / 2), cha);
            detailLines.push(
              "Gain a new Bond with " + therapistBondLabel +
              " at " + newTherapistBondValue + " (1/2 CHA)."
            );
          } else {
            notes.push(
              "CHA not provided; handler should record new therapist Bond at 1/2 CHA manually."
            );
          }
        }

        notes.push(
          "If you describe criminal or unnatural events and the therapist believes them, " +
          "there is a risk of investigation or further exposure to the unnatural."
        );
        break;
      }

      case HOME_PURSUIT_IDS.IMPROVE_SKILLS_OR_STATS: {
        // Cost: reduce a non-DG Bond by 1 per increase (Handler decides which Bond).
        if (costBond != null) {
          let increases;
          if (typeof ctx.increases === "number") {
            increases = ctx.increases;
          } else if (ctx.improveTargets && Array.isArray(ctx.improveTargets) && ctx.improveTargets.length > 0) {
            increases = ctx.improveTargets.length;
          } else {
            increases = 1;
          }

          costBond -= increases;
          costBond = clampBond(costBond, cha);
          detailLines.push(
            costBondLabel + " Bond -" + increases + " for training/improvement."
          );
        } else {
          notes.push(
            "Improving skills or stats usually requires a non-DG Bond to reduce by 1 per increase."
          );
        }

        detailLines.push("Pursuit: Improve skills or stats.");

        const targets = (ctx.improveTargets && Array.isArray(ctx.improveTargets))
          ? ctx.improveTargets
          : [];

        improveResults = targets.map(function (t) {
          const target = t.rollTarget != null ? t.rollTarget : 0; // usually current %
          const r = t.preRolledD100 != null ? t.preRolledD100 : rollDie(100);
          const res = determineRollResult(r, target);
          let delta = 0;

          if (res === ROLL_RESULTS.FAILURE) {
            // RAW: roll OVER current skill to improve -> treat FAILURE as "over"
            if (t.isSkill) {
              const gain = rollFormula("3d6").total;
              delta = gain;
              detailLines.push(
                "Failure on " + t.name + ": +" + gain + " to skill (3d6)."
              );
            } else {
              delta = 1;
              detailLines.push("Failure on " + t.name + ": +1 to stat.");
            }
          } else if (res === ROLL_RESULTS.SUCCESS) {
            detailLines.push(
              "Success on " + t.name + ": no improvement."
            );
          } else if (res === ROLL_RESULTS.CRITICAL) {
            // Optional: let criticals improve as well
            if (t.isSkill) {
              const gain = rollFormula("3d6").total;
              delta = gain;
              detailLines.push(
                "Critical on " + t.name + ": +" + gain + " to skill (3d6)."
              );
            } else {
              delta = 1;
              detailLines.push("Critical on " + t.name + ": +1 to stat.");
            }
          } else if (res === ROLL_RESULTS.FUMBLE) {
            detailLines.push(
              "Fumble on " + t.name + ": no improvement (you can house-rule penalties)."
            );
          }

          return {
            id: t.id,
            key: t.key,
            kind: t.kind,
            name: t.name,
            isSkill: !!t.isSkill,
            roll: r,
            target: target,
            result: res,
            delta: delta
          };
        });

        // No single outcome here; multiple rolls instead
        outcome = null;
        break;
      }

      case HOME_PURSUIT_IDS.INDULGE_MOTIVATION: {
        if (rollTarget == null) rollTarget = san;
        ensurePercentileRoll(rollTarget);

        detailLines.push(
          "Pursuit: Indulge a personal motivation",
          "Roll: " + roll + " vs " + rollTarget + " → " + outcome.toUpperCase()
        );

        let sanGain = 0;

        if (outcome === ROLL_RESULTS.FUMBLE) {
          sanGain = -1;
          detailLines.push("Fumble: lose 1 SAN.");
        } else if (outcome === ROLL_RESULTS.FAILURE) {
          sanGain = 0;
          detailLines.push("Failure: no change in SAN.");
        } else if (outcome === ROLL_RESULTS.SUCCESS) {
          sanGain = 1;
          detailLines.push("Success: gain 1 SAN.");
        } else if (outcome === ROLL_RESULTS.CRITICAL) {
          const gain = rollFormula("1d4").total;
          sanGain = gain;
          detailLines.push("Critical: gain " + gain + " SAN (1d4).");
        }

        san += sanGain;
        san = clampSan(san, pow);

        if (sanGain > 0) {
          if (costBond != null) {
            costBond -= 1;
            costBond = clampBond(costBond, cha);
            detailLines.push(
              costBondLabel +
              " Bond -1 (you neglect this Bond while indulging your motivation)."
            );
          } else {
            notes.push(
              "Indulging a motivation: SAN improved but no costBondValue provided; reduce a non-DG Bond by 1 manually."
            );
          }
        }
        break;
      }

      case HOME_PURSUIT_IDS.SPECIAL_TRAINING: {
        if (costBond != null) {
          costBond -= 1;
          costBond = clampBond(costBond, cha);
          detailLines.push(
            costBondLabel + " Bond -1 (time and focus spent training)."
          );
        } else {
          notes.push("Special training requires a non-DG Bond to reduce by 1.");
        }

        detailLines.push(
          "Pursuit: Special training (no roll).",
          "Effect: Gain special training with one skill or stat (Handler decides)."
        );

        outcome = null;
        break;
      }

      case HOME_PURSUIT_IDS.STAY_ON_THE_CASE: {
        if (costBond != null) {
          costBond -= 1;
          costBond = clampBond(costBond, cha);
          detailLines.push(
            costBondLabel + " Bond -1 (obsessed with the case)."
          );
        } else {
          notes.push("Stay on the case requires a non-DG Bond to reduce by 1.");
        }

        const sanShift = rollDie(6) - 3; // can be negative or positive
        if (sanShift !== 0) {
          san += sanShift;
          san = clampSan(san, pow);
          detailLines.push(
            "Home cost: SAN " +
            (sanShift > 0 ? "+" : "") +
            sanShift +
            " (1d6-3)."
          );
        } else {
          detailLines.push("Home cost: SAN ±0 (1d6-3).");
        }

        if (rollTarget == null) rollTarget = 50;
        ensurePercentileRoll(rollTarget);

        detailLines.push(
          "Investigation roll (Criminology/Occult): " +
            roll +
            " vs " +
            rollTarget +
            " → " +
            outcome.toUpperCase()
        );

        if (outcome === ROLL_RESULTS.FUMBLE) {
          clueQuality = "dangerouslyWrong";
          detailLines.push("Result: Uncover a dangerously wrong clue.");
        } else if (outcome === ROLL_RESULTS.FAILURE) {
          clueQuality = "none";
          detailLines.push("Result: No useful clue.");
        } else if (outcome === ROLL_RESULTS.SUCCESS) {
          clueQuality = "pertinent";
          detailLines.push("Result: Uncover a pertinent clue.");
        } else if (outcome === ROLL_RESULTS.CRITICAL) {
          clueQuality = "valuable";
          detailLines.push("Result: Uncover an especially valuable clue.");
        }
        break;
      }

      case HOME_PURSUIT_IDS.STUDY_UNNATURAL: {
        if (costBond != null) {
          const loss = rollFormula("1d4").total;
          costBond -= loss;
          costBond = clampBond(costBond, cha);
          detailLines.push(
            costBondLabel +
            " Bond -" +
            loss +
            " (1d4) from obsession with the unnatural."
          );
        } else {
          notes.push(
            "Study the unnatural requires a non-DG Bond to reduce by 1d4."
          );
        }

        detailLines.push(
          "Pursuit: Study the unnatural.",
          "Roll and effects depend entirely on the source (Handler decides SAN/Unnatural changes)."
        );

        outcome = null;
        break;
      }

      default:
        throw new Error("Unknown home pursuit id: " + pursuitId);
    }

    // -----------------------------------------------------------------------
    // Clamp + summary
    // -----------------------------------------------------------------------
    san = clampSan(san, pow);
    if (primaryBond != null) primaryBond = clampBond(primaryBond, cha);
    if (costBond != null) costBond = clampBond(costBond, cha);
    if (therapistBond != null) therapistBond = clampBond(therapistBond, cha);

    const sanAfter = san;
    const sanDelta = sanAfter - sanBefore;

    const bondsAfter = {
      primary: primaryBond,
      cost: costBond,
      therapist: therapistBond
    };

    const logLines = [].concat(detailLines);
    if (notes.length) {
      logLines.push("", "Handler Notes:");
      for (let i = 0; i < notes.length; i++) {
        logLines.push("- " + notes[i]);
      }
    }

    return {
      pursuitId: pursuitId,
      outcome: outcome,
      roll: roll,
      rollTarget: rollTarget,
      sanBefore: sanBefore,
      sanAfter: sanAfter,
      sanDelta: sanDelta,
      bondsBefore: bondsBefore,
      bondsAfter: bondsAfter,
      newBondValue: newBondValue,
      newBondLabel: newBondLabel,
      newTherapistBondValue: newTherapistBondValue,
      therapistBondLabel: therapistBondLabel,
      improveResults: improveResults,
      clueQuality: clueQuality,
      notes: notes,
      log: logLines.join("\n")
    };
  }
}
