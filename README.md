# LivingLang

> A programming language for creating living, breathing immersive experiences

LivingLang is human-centered programming language for crafting immersive experiences that adapt and respond to audience interaction. It combines concepts from game engines, immersive theatre design, and reactive programming to create dynamic, audience-driven environments. 

In a world where AI increasingly proliferates in the virtual, LivingLang is a way to give us humans more agency in the physical. Connect us more with each other and the conscious creation of culture.

A program written in LivingLang is a story to be executed and experienced by humans. It is a story about a living environment, the people in that space, the choices they make and their consequences. Automation, technology and AI fades to the background, contributing to people's agency in the world and becoming a reflection of it.

## Key Features

🌱 **Living Environments**
- Reactive spaces that evolve with audience interaction
- Dynamic atmosphere control
- Adaptive narrative flows

🎭 **Storylines**
- Scene composition and management
- Actor behavior
- Timing and cue systems

🔄 **Reactive Systems**
- Event-driven architecture
- State management
- Real-time adaptation

🧠 **AI Integration**
- Contextual completions
- Behavioral adaptation
- Dynamic content generation

## Quick Start

```
experience HelloWorld {
  space MainRoom {
    atmosphere {
      lighting = ambient("warm")
      sound = background("gentle")
    }
    
    on audience.enter {
      trigger welcome_sequence
    }
  }

  sequence welcome_sequence {
    scene {
      duration = 2.minutes
      lighting.fadeTo("bright", 5.seconds)
      sound.layer("welcome_theme")
    }
  }
}
```

## Core Concepts

### Spaces
Spaces in LivingLang are more than just physical locations - they're reactive environments that respond to audience presence and story progression:

```scala
space Library {
  zones {
    reading_area = Circle(center, 5.meters)
    stacks = Grid(5 by 3.meters)
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
Actors are autonomous agents that can interact with the audience and space:

```scala
actor Guide {
  behavior = FlowField {
    attract = audience.centers
    avoid = obstacles
    style = "natural"
  }

  interaction {
    radius = 2.meters
    on_approach = greet
    on_engage = respond_to_interest
  }
}
```

### Sequences
Create complex, branching narratives that respond to audience behavior:

```scala
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
LivingLang integrates with AI to generate dynamic content and behaviors:

```scala
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

```scala
state_machine Tension {
  states = [calm, building, intense, release]
  
  transitions {
    calm -> building when audience.engagement > 0.7
    building -> intense via gradual(2.minutes)
    intense -> release when story.climax_reached
  }
}
```

## Installation

```bash
npm install livinglang
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