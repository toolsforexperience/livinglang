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

## Quick Start

**Requirements**
- Node.js v23 or higher

1. Install the extension from VS Code marketplace
2. Create a new file with `.living` extension
3. Here's a minimal example that demonstrates core concepts:

```ts
space CoffeeShop {
  atmosphere {
    lighting: warm
    sound: cafe_ambience
  }
  
  zones {
    counter {
      lighting: bright
      activity: ordering
    }
  }
}

actor Barista {
  name: 'Alex'
  description: 'Friendly coffee shop barista'
  
  behavior {
    style: welcoming
    location: counter
  }
}

scene WelcomeCustomer in space CoffeeShop.counter {
  actions {
    Barista.greet()
    Barista.takeOrder()
  }
}

experience CoffeeMorning {
  setup {
    time: morning
    location: CoffeeShop
  }
  
  trigger WelcomeCustomer
}
```

This simple example shows the main concepts: spaces, actors, scenes and experiences. For more complex examples, see our examples directory.

## Core Concepts

### Spaces
Spaces are reactive environments that respond to audience presence and story progression:

```ts
space Library {
  zones {
    reading_area: Circle(center, 5 meters)
    stacks: Grid(5 by 3 meters)
  }

  atmosphere: reactive {
    match audience.activity {
      case Exploring => mysterious
      case Reading => peaceful
      case Gathering => energetic
    }
  }
}
```

### Actors
Actors are people following a script that can interact with the audience and space:

```ts
actor Guide {
  behavior: FlowField {
    attract: audience.centers
    avoid: obstacles
    style: natural
  }

  interaction {
    radius: 2.meters
    on_approach: greet
    on_engage: respond_to_interest
  }
}
```

### Sequences
Sequences are a way to structure the story. They can be triggered by events or conditions.
They are composed of scenes and can have branches.

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

### Identities
Identities are a way to keep track of the audience's progression and meaning within the story.

```ts
identity: {
  progression_milestones: [Milestone]
  meaning_milestones: [Milestone]
}
```

### Memory
Memory is a way to keep track of the audience's progression and meaning within the story.

```ts
story_memory {
  participants: [Person]
  history: Timeline {
    events: [SharedExperience]
    milestones: [RelationshipMilestone]
    emotions: EmotionalTrajectory
  }
  trust_level: DynamicMetric
  comfort_zones: AdaptiveMap
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