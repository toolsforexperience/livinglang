# LivingLang VS Code Extension

> A programming language for creating immersive experiences and storylines

LivingLang is human-centered programming language for crafting immersive experiences that adapt and respond to audience interaction. It combines concepts from game engines, immersive theatre design, and reactive programming to create dynamic, audience-driven environments. 

In a world where AI increasingly proliferates in the virtual, LivingLang is a way to give us humans more agency in the physical. Connect us more with each other and enable the conscious creation of culture.

A program written in LivingLang is a story to be executed and experienced by humans. It is a narrative about the people in a space, the choices they make and their consequences. Automation, technology and AI remains to the background, contributing to people's agency in the world.

## Key Features

🌱 **Environments**
- Reactive spaces that evolve with audience interaction
- Dynamic atmosphere control
- Adaptive narrative flows

🎭 **Storylines**
- Scene composition and management
- Actor character and behavior
- Timing and cue

🔄 **Reactive Systems**
- Event-driven architecture
- State management
- Real-time adaptation

🧠 **AI Integration**
- Contextual completions
- Behavioral adaptation
- Dynamic content generation

## Quick Start

```ts
space Elsinore {
  atmosphere {
    lighting: ambient("cold")
    sound: background("wind_battlements")
    fog: dense 
  }
  
  zones {
    battlements {
      height: elevated
      exposure: extreme
    }
    throne_room {
      lighting: formal
      atmosphere: oppressive
    }
    chapel {
      lighting: dim
      atmosphere: sacred
    }
  }
}

actor Hamlet {
  name: "Prince Hamlet"
  description: "Prince of Denmark, melancholic, philosophical"
  
  archetypes: [prince, mourner, philosopher]
  temperament: [melancholic, intelligent, conflicted]
  
  state: {
    grief: high
    suspicion: growing
    madness: potential
  }
}

actor Ghost {
  name: "Ghost of King Hamlet"
  description: "Former King of Denmark, Hamlet's father"
  
  archetypes: [spirit, king, accuser]
  appearance: [armored, ethereal]
  
  movement: {
    style: ethereal
    pattern: deliberate
    constraints: [night_only, battlements_only]
  }
}

monologue toBeOrNotToBe {
  Hamlet: """
    To be, or not to be, that is the question:
    Whether 'tis nobler in the mind to suffer
    The slings and arrows of outrageous fortune,
    Or to take Arms against a Sea of troubles...
  """
}

dialogue ghostReveal {
  Ghost: "I am thy father's spirit"
  Hamlet: "O God!"
  Ghost: "Doomed for a certain term to walk the night"
  
  Ghost.approaches(Hamlet)
  
  Ghost: """
    Murder most foul, as in the best it is,
    But this most foul, strange, and unnatural.
  """
}

scene GhostOnBattlements in space Elsinore.battlements {
  atmosphere {
    lighting: night
    sound: [wind_howling, distant_bells]
    temperature: freezing
  }
  
  actions {
    Ghost.appears()
    Ghost.approachesSlowly(Hamlet)
    ghostReveal
  }
}

sequence OpeningNight {
  scene GuardWatch {
    duration: 10.minutes
    atmosphere.buildTension()
    Ghost.appearAndVanish(times: 2)
  }
  
  scene GhostOnBattlements
  
  scene AfterGhost {
    Hamlet.state.suspicion = maximum
    trigger conspiracy_awareness
  }
}

experience Hamlet {
  setup {
    time = night
    location = Elsinore
    political_tension = high
  }
  
  trigger OpeningNight
  
  branches {
    "Follow the Ghost" {
      requires(Hamlet.courage > fear)
      trigger ghost_revelation
    }
    "Resist Following" {
      trigger missed_truth
    }
  }
}
```

## Core Concepts

### Spaces
Spaces in LivingLang are reactive environments that respond to audience presence and story progression:

```ts
space Library {
  zones {
    reading_area = Circle(center, 5 meters)
    stacks = Grid(5 by 3 meters)
  }

  atmosphere = reactive {
    match audience.activity {
      case Exploring => mysterious
      case Reading => peaceful
      case Gathering => energetic
    }
  }
}
```

### Actors
Actors are people following a script, that can interact with the audience and space:

```ts
actor Guide {
  behavior: FlowField {
    attract: audience.centers
    avoid: obstacles
    style: "natural"
  }

  interaction {
    radius: 2.meters
    on_approach: greet
    on_engage: respond_to_interest
  }
}
```

### Sequences
Create complex, branching narratives that respond to audience behavior:

```ts
sequence MainStory {
  branch {
    path discovery {
      when audience.curious
      leads_to revelation
    }

    path mystery {
      when audience.cautious
      leads_to investigation
    }
  }
}
```

## Advanced Features

### AI Completions
LivingLang intends to integrate with AI to generate dynamic content and behaviors, where the details of the script are not fully defined, for variations or emergence.

```ts
actor Character {
  ai prompt {
    role: "Victorian librarian with {secret}"
    personality: generate(traits=3)
    knowledge: align_with(story.theme)
  }
}
```

### State Management
Complex state machines for managing experience flow:

```ts
state_machine Tension {
  states = [calm, building, intense, release]
  
  transitions {
    calm -> building when audience.engagement > 0.7
    building -> intense via gradual(2.minutes)
    intense -> release when story.climax_reached
  }
}
```

## Roadmap

- [ ] Implement the core language features in the language server
- [ ] Experiment with AI integration for dynamic details
- [ ] Add support for more complex narratives and audience interaction
- [ ] Integrate with providers for physical spaces
- [ ] Integrate with AI visualization tools
- [ ] Experiment with a potential intellectual property management system

## Development

To run the extension in development mode:

1. **Setup**
```bash
# Install dependencies
npm install

# Build the extension
npm run compile
```

2. **Running the Extension**

```bash
# Run the extension in Chrome
npm run chrome
```
This will open Chrome with VS Code Web and the extension loaded.

3. **Development Workflow**
- Use `npm run watch` to automatically recompile on changes
- The extension will auto-reload in VS Code when you make changes
- Check the Debug Console for extension output and errors
- Use the "Developer: Reload Window" command to reload the extension

4. **Building VSIX Package**
```bash
# Create a VSIX package for distribution
npm run vsix
```
This will create `livinglang-1.0.0.vsix` in the root directory.

5. **Testing**
```bash
# Run the test suite
npm test
```

## Documentation

Visit our [full documentation](https://livinglang.dev/docs) for:
- Complete API reference
- Advanced tutorials
- Best practices
- Example projects

## Community and Support

- [Discord Community](https://discord.gg/livinglang)
- [GitHub Discussions](https://github.com/livinglang/livinglang/discussions)
- [StackOverflow Tag](https://stackoverflow.com/questions/tagged/livinglang)

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details on:
- Development setup
- Coding standards
- Pull request process

## License

MIT License - see [LICENSE](LICENSE) for details