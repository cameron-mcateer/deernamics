import { getFieldLabel, getFieldTooltip } from './field-meta';
import { bindTooltip } from './tooltip';

type Behavior = {
  name: string;
  priority: number;
  description: string;
  configFields: string[]; // "section.key" references, e.g. "deer.fearRadius"
};

type ActorInfo = {
  label: string;
  color: string;
  overview: string;
  behaviors: Behavior[];
};

const ACTORS: ActorInfo[] = [
  {
    label: 'Deer',
    color: '#8B6914',
    overview: 'Deer are herbivores that graze on grass to gain energy. They flee from wolves, flock with nearby peers, and reproduce when well-fed. They appear as small brown circles on the map.',
    behaviors: [
      {
        name: 'Flee',
        priority: 1,
        description: 'Triggered when any wolf is within detection range. The deer computes the centroid of all nearby wolves and runs directly away from it. Fleeing costs extra energy due to the sprint.',
        configFields: ['deer.fearRadius', 'deer.fleeDrainMultiplier', 'deer.speed'],
      },
      {
        name: 'Reproduce',
        priority: 2,
        description: 'When energy exceeds the threshold and cooldown has expired, the deer seeks a nearby partner also in reproduce mode. If they are close enough, they produce one offspring at the midpoint. Both parents lose energy and enter a cooldown period.',
        configFields: ['deer.reproduceThreshold', 'deer.reproduceDrain', 'deer.reproduceRadius', 'deer.reproductionCooldownTicks'],
      },
      {
        name: 'Graze',
        priority: 3,
        description: 'When energy drops below the graze threshold, the deer eats grass from its current cell. If the cell is nearly depleted (below the preserve threshold) and better grass is nearby, the deer moves toward the richer cell instead. If the current cell is empty, the deer scans its view radius for the best grass and heads toward it.',
        configFields: ['deer.startGrazeLevel', 'deer.stopGrazeLevel', 'deer.grazeRate', 'deer.grazeEnergyGain', 'deer.grazePreserveThreshold', 'deer.viewRadius'],
      },
      {
        name: 'Wander',
        priority: 4,
        description: 'Default behavior when not fleeing, grazing, or reproducing. The deer drifts with momentum and random noise. If peers are spread out (above the flock threshold), the deer biases its heading toward the group centroid to stay together.',
        configFields: ['deer.speed', 'deer.viewRadius', 'deer.flockThreshold', 'deer.passiveDrainPerTick', 'deer.movementDrainMultiplier'],
      },
    ],
  },
  {
    label: 'Wolf',
    color: '#CC2200',
    overview: 'Wolves are predators that hunt deer for energy. They are slowed by dense grass, flock loosely with peers, and reproduce when well-fed. They appear as slightly larger red circles on the map.',
    behaviors: [
      {
        name: 'Reproduce',
        priority: 1,
        description: 'When energy exceeds the threshold and cooldown has expired, the wolf seeks a nearby partner also in reproduce mode. If close enough, they produce one offspring. Both parents lose energy and enter a cooldown period.',
        configFields: ['wolf.reproduceThreshold', 'wolf.reproduceDrain', 'wolf.reproduceRadius', 'wolf.reproductionCooldownTicks'],
      },
      {
        name: 'Hunt',
        priority: 2,
        description: 'When energy drops below the hunt threshold, the wolf chases the nearest visible deer. If a deer is within catch radius, it is killed instantly and the wolf gains a burst of energy. Hunting costs extra energy due to the sprint. Wolves are slowed when moving through dense grass.',
        configFields: ['wolf.startHuntLevel', 'wolf.stopHuntLevel', 'wolf.catchRadius', 'wolf.huntEnergyGain', 'wolf.huntDrainMultiplier', 'wolf.viewRadius', 'wolf.grassSlowThreshold', 'wolf.grassSlowFactor'],
      },
      {
        name: 'Wander',
        priority: 3,
        description: 'Default behavior when not hunting or reproducing. The wolf drifts with momentum and random noise. If peers are spread out, the wolf biases its heading toward the group centroid. Wolves move faster than deer but are slowed by tall grass.',
        configFields: ['wolf.speed', 'wolf.viewRadius', 'wolf.flockThreshold', 'wolf.passiveDrainPerTick', 'wolf.movementDrainMultiplier'],
      },
    ],
  },
  {
    label: 'Grass',
    color: '#22B422',
    overview: 'Grass is the foundation of the ecosystem. It grows on placed cells each tick, is consumed by grazing deer, and does not spread to empty cells. Cells with no grass remain empty unless manually painted. Grass level is shown as green intensity on the map.',
    behaviors: [
      {
        name: 'Growth',
        priority: 1,
        description: 'Each tick, every cell that has some grass grows toward its maximum level. Cells at zero do not grow — grass only exists where it has been placed or seeded. Growth rate determines how quickly grazed cells recover.',
        configFields: ['grass.maxLevel', 'grass.growthRatePerTick'],
      },
      {
        name: 'Consumption',
        priority: 2,
        description: 'When a deer grazes on a cell, the cell loses grass equal to the deer\'s graze rate (floored at zero). If the cell drops to zero, it stops growing entirely. Deer avoid consuming nearly-empty cells if better options exist nearby.',
        configFields: ['deer.grazeRate', 'deer.grazePreserveThreshold'],
      },
    ],
  },
];

export function createInfoPanel(container: HTMLElement) {
  const tabs = document.createElement('div');
  tabs.className = 'info-tabs';

  const content = document.createElement('div');
  content.className = 'info-content';

  const tabButtons: HTMLButtonElement[] = [];
  const panels: HTMLDivElement[] = [];

  for (let i = 0; i < ACTORS.length; i++) {
    const actor = ACTORS[i];

    const btn = document.createElement('button');
    btn.textContent = actor.label;
    btn.style.borderBottom = `3px solid ${actor.color}`;
    btn.addEventListener('click', () => activate(i));
    tabButtons.push(btn);
    tabs.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'info-actor-panel';

    const overview = document.createElement('p');
    overview.className = 'info-overview';
    overview.textContent = actor.overview;
    panel.appendChild(overview);

    for (const behavior of actor.behaviors) {
      const section = document.createElement('div');
      section.className = 'info-behavior';

      const header = document.createElement('h4');
      const badge = document.createElement('span');
      badge.className = 'info-priority';
      badge.textContent = String(behavior.priority);
      header.appendChild(badge);
      header.appendChild(document.createTextNode(` ${behavior.name}`));
      section.appendChild(header);

      const desc = document.createElement('p');
      desc.textContent = behavior.description;
      section.appendChild(desc);

      const fields = document.createElement('div');
      fields.className = 'info-fields';
      const fieldsLabel = document.createElement('span');
      fieldsLabel.className = 'info-fields-label';
      fieldsLabel.textContent = 'Config: ';
      fields.appendChild(fieldsLabel);
      behavior.configFields.forEach((ref, idx) => {
        if (idx > 0) fields.appendChild(document.createTextNode(', '));
        const span = document.createElement('span');
        span.className = 'info-field-ref';
        span.textContent = getFieldLabel(ref);
        const tooltip = getFieldTooltip(ref);
        if (tooltip) {
          span.setAttribute('data-tooltip', tooltip);
          bindTooltip(span);
        }
        fields.appendChild(span);
      });
      section.appendChild(fields);

      panel.appendChild(section);
    }

    panels.push(panel);
    content.appendChild(panel);
  }

  function activate(index: number) {
    tabButtons.forEach((b, i) => b.classList.toggle('active', i === index));
    panels.forEach((p, i) => p.style.display = i === index ? 'block' : 'none');
  }

  activate(0);
  container.append(tabs, content);
}
