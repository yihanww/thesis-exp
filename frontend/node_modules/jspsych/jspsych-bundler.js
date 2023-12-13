// Bundles the jsPsych package together so it isn't a global variable
import jsPsych from "jspsych";

export default function bundle(list_of_plugins) {
  for (const plugin of list_of_plugins) {
    jsPsych.plugins[plugin.info.name] = plugin;
  }
  return jsPsych;
}
