import re

def parse_learning_plan(text):
    plan = []
    current_module = None
    current_submodule = None

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Remove Markdown **bold** and leading bullets
        line = re.sub(r'\*\*', '', line)  # remove bold markers
        line = re.sub(r'^\*+\s*', '', line)  # remove bullets

        # Match Module
        module_match = re.match(r'Module \d+: (.+)', line)
        if module_match:
            current_module = {"module": module_match.group(1).strip(), "submodules": []}
            plan.append(current_module)
            current_submodule = None
            continue

        # Match Submodule
        submodule_match = re.match(r'Submodule \d+\.\d+: (.+)', line)
        if submodule_match:
            current_submodule = {"submodule": submodule_match.group(1).strip(), "units": []}
            if current_module:
                current_module["submodules"].append(current_submodule)
            continue

        # Match Unit
        unit_match = re.match(r'Unit \d+\.\d+\.\d+: (.+)', line)
        if unit_match:
            if current_submodule:
                current_submodule["units"].append(unit_match.group(1).strip())
            continue

    return plan

content = """Okay, here's a structured learning plan for Python, designed to provide a solid foundation in a concise format:

**Module 1: Python Fundamentals**

  *   **Submodule 1.1: Introduction to Python**
    *   Unit 1.1.1: What is Python? (History, uses, advantages)
    *   Unit 1.1.2: Setting up your environment (Installation, IDEs, Text Editors)
    *   Unit 1.1.3: Your First Python Program (Hello, World!)
  *   **Submodule 1.2: Basic Data Types and Operators**
    *   Unit 1.2.1: Data Types (Integers, Floats, Strings, Booleans)
    *   Unit 1.2.2: Variables and Assignment
    *   Unit 1.2.3: Operators (Arithmetic, Comparison, Logical)
  *   **Submodule 1.3: Input and Output**
    *   Unit 1.3.1: The `print()` function (Formatting output)
    *   Unit 1.3.2: The `input()` function (Getting user input)
    *   Unit 1.3.3: Type Conversion (Casting between data types)

**Module 2: Control Flow and Data Structures**

  *   **Submodule 2.1: Conditional Statements**
    *   Unit 2.1.1: `if`, `elif`, `else` statements
    *   Unit 2.1.2: Nested conditional statements
    *   Unit 2.1.3: Truthiness and Falsiness
  *   **Submodule 2.2: Loops**
    *   Unit 2.2.1: `for` loops (Iterating over sequences)
    *   Unit 2.2.2: `while` loops (Conditional looping)
    *   Unit 2.2.3: `break` and `continue` statements
  *   **Submodule 2.3: Basic Data Structures**
    *   Unit 2.3.1: Lists (Creating, accessing, modifying)
    *   Unit 2.3.2: Tuples (Creating, accessing)
    *   Unit 2.3.3: Dictionaries (Creating, accessing, modifying)

**Module 3: Functions and Modules**

  *   **Submodule 3.1: Functions**
    *   Unit 3.1.1: Defining functions (Parameters, return values)
    *   Unit 3.1.2: Calling functions (Arguments)
    *   Unit 3.1.3: Scope (Local vs. Global variables)
  *   **Submodule 3.2: Modules**
    *   Unit 3.2.1: What are modules? (Code organization)
    *   Unit 3.2.2: Importing modules (`import`, `from ... import`)
    *   Unit 3.2.3: Using standard library modules (e.g., `math`, `random`)

**Module 4: Working with Files and Error Handling**

  *   **Submodule 4.1: File Input/Output**
    *   Unit 4.1.1: Opening and closing files (`open()`, `close()`)
    *   Unit 4.1.2: Reading from files (`read()`, `readline()`, `readlines()`)
    *   Unit 4.1.3: Writing to files (`write()`, `writelines()`)
  *   **Submodule 4.2: Error Handling**
    *   Unit 4.2.1: Types of errors (SyntaxError, NameError, TypeError, etc.)
    *   Unit 4.2.2: `try...except` blocks (Handling exceptions)
    *   Unit 4.2.3: `finally` blocks (Cleanup code)

**Module 5: Object-Oriented Programming (OOP) Basics**

  *   **Submodule 5.1: Introduction to OOP**
    *   Unit 5.1.1: What is OOP? (Principles: Encapsulation, Inheritance, Polymorphism)
    *   Unit 5.1.2: Classes and Objects
    *   Unit 5.1.3: Attributes and Methods
  *   **Submodule 5.2: Creating Classes**
    *   Unit 5.2.1: Defining classes (`class` keyword)
    *   Unit 5.2.2: The `__init__` method (Constructor)
    *   Unit 5.2.3: Instance methods (Accessing and modifying attributes)

This structure provides a logical progression from basic concepts to more advanced topics, suitable for a beginner-to-intermediate Python learner. Remember to practice with coding exercises after each unit to reinforce your understanding."""


structured_plan = parse_learning_plan(content)
print(structured_plan)