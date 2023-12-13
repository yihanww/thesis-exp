export function generateRatingTrials({
  stimuli,
  type = "image-slider-response",
  stimulus_width = 400,
  slider_width = 600,
  condition = "Competent",
  labels = ["Not at all Competent", "Extremely Competent"],
  prompt = `<h1 class="text-center mt-2 mb-4">How competent is this face?</h1>`,
  experiment_phase = "practice",
  slider_amount_visible = true,
  show_slider_delay = 500,
  post_trial_gap = 500,
  response_ends_trial = true,
}) {
  return _.map(stimuli, (stimulus) => {
    return {
      type,
      stimulus_width,
      slider_width,
      post_trial_gap,
      stimulus,
      labels,
      prompt,
      response_ends_trial,
      slider_amount_visible,
      show_slider_delay,
      data: {
        condition,
        experiment_phase,
      },
    };
  });
}

export function generateDescriptionTrials({
  stimuli = [],
  trial_type = "face-description-trial",
  stimulus_width = 400,
  preamble = `<p class="text-center mt-2 mb-5 h3">
  Please write everything that comes to mind about this image.<br>
  Describe it as completely as you can.
  </p>`,
  questions = [
    {
      prompt: undefined,
      placeholder: "Enter your description here",
      rows: 6,
      columns: 40,
      required: true,
      name: "description"
    }
  ],
  response_ends_trial = true,
  condition = undefined,
  experiment_phase = "main",
  post_trial_gap = 100,
}) {

  if (stimuli.length === 0) {
    throw new Error("No stimuli provided!");
  }

  let trials = [];

  for (const stimulus of stimuli) {
    const this_trial = {
      type: trial_type,
      image: `<img src="${stimulus}" alt="image" class="mb-5" style="width: ${stimulus_width}px;">`,
      preamble,
      questions,
      response_ends_trial,
      data: {
        condition,
        experiment_phase,
        stimulus,
      },
      post_trial_gap,
    };
    trials.push(this_trial);
  }

  trials = _.shuffle(trials);

  return trials;
}
