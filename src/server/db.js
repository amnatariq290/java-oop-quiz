import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendInstructorLoginEmail } from './email.js';

const DB_FILE = path.resolve(process.cwd(), 'data/quiz-db.json');
const TMP_FILE = path.resolve(process.cwd(), 'data/quiz-db.tmp.json');

export function getAuthorizedInstructorEmail() {
  return (process.env.INSTRUCTOR_EMAIL || "naveed.khan@uettaxila.edu.pk").trim().toLowerCase();
}

// Standard Java OOP Topic Library as defined in requirement #15
export const DEFAULT_TOPICS = [
  {
    id: "classes-objects",
    name: "Classes & Objects",
    category: "Fundamentals",
    desc: "Class definitions, heap objects, instance variables, methods, and memory blueprints"
  },
  {
    id: "constructors",
    name: "Constructors & Overloading",
    category: "Fundamentals",
    desc: "Default and parameterized constructors, constructor overloading, and this() invocation"
  },
  {
    id: "encapsulation",
    name: "Encapsulation & Access Modifiers",
    category: "Encapsulation",
    desc: "Private fields, access modifiers (public/private/protected), getters, setters, and data hiding"
  },
  {
    id: "inheritance",
    name: "Inheritance & Class Hierarchies",
    category: "Inheritance",
    desc: "extends keyword, super keyword, single and multilevel inheritance, and IS-A relationship"
  },
  {
    id: "polymorphism",
    name: "Polymorphism & Method Overriding",
    category: "Polymorphism",
    desc: "Method overriding, method overloading, dynamic method dispatch, and runtime behavior"
  },
  {
    id: "abstraction",
    name: "Abstraction & Abstract Classes",
    category: "Abstraction",
    desc: "Abstract classes, abstract methods, partial implementation, and conceptual system design"
  },
  {
    id: "interfaces",
    name: "Interfaces & Contracts",
    category: "Abstraction",
    desc: "implements keyword, interface default methods, multiple inheritance through interfaces"
  },
  {
    id: "oop-keywords",
    name: "OOP Keywords & Object Class",
    category: "Related Concepts",
    desc: "final keyword, static members, Object class (toString, equals), composition & HAS-A"
  }
];

// Rich, Normal-Difficulty Question Bank (50+ high-quality normal-difficulty university questions)
export const QUESTION_BANK = [
  // --- TOPIC: classes-objects ---
  {
    id: "q-co-01",
    topicId: "classes-objects",
    topic: "Classes & Objects",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "What memory area in the Java Virtual Machine (JVM) stores instances of objects created with the 'new' keyword?",
    codeSnippet: "Car myCar = new Car(); // Where is the actual Car instance allocated?",
    options: [
      { id: "opt-a", text: "Stack Memory" },
      { id: "opt-b", text: "Heap Memory" },
      { id: "opt-c", text: "Register Cache" },
      { id: "opt-d", text: "Static Instruction Cache" }
    ],
    correctAnswer: "opt-b",
    explanation: "In Java, all objects and array instances reside in the JVM Heap Memory, while local reference variables live on the Stack.",
    isActive: true
  },
  {
    id: "q-co-02",
    topicId: "classes-objects",
    topic: "Classes & Objects",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "A class serves as a template or blueprint for creating runtime ________.",
    codeSnippet: "Student s1 = new Student();\nStudent s2 = new Student();",
    acceptedAnswers: ["objects", "object", "instances", "instance"],
    explanation: "A class is the compile-time definition or blueprint; objects (or instances) are created from that blueprint.",
    isActive: true
  },
  {
    id: "q-co-03",
    topicId: "classes-objects",
    topic: "Classes & Objects",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which keyword is used in Java to instantiate an object from a class definition?",
    codeSnippet: "Rectangle rect = _____ Rectangle(10, 20);",
    options: [
      { id: "opt-a", text: "alloc" },
      { id: "opt-b", text: "create" },
      { id: "opt-c", text: "new" },
      { id: "opt-d", text: "instanceof" }
    ],
    correctAnswer: "opt-c",
    explanation: "The 'new' operator allocates memory on the heap and initializes the newly created object by invoking its constructor.",
    isActive: true
  },
  {
    id: "q-co-04",
    topicId: "classes-objects",
    topic: "Classes & Objects",
    questionType: "SCENARIO",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Explain the difference between an instance variable and a static variable in a Java class. When would you use a static variable?",
    codeSnippet: "public class Counter {\n    int count = 0;        // Instance variable\n    static int total = 0; // Static variable\n}",
    expectedKeywords: ["shared", "all instances", "class level", "per object", "memory", "single copy"],
    gradingRubric: "Must state that instance variables belong to individual objects, while static variables are shared across all instances of the class.",
    explanation: "Instance variables are duplicated for each created object, while static variables have a single copy tied to the class itself, ideal for counters or constants.",
    isActive: true
  },
  {
    id: "q-co-05",
    topicId: "classes-objects",
    topic: "Classes & Objects",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "What is the default initial value of an uninitialized instance field of type boolean in a Java class?",
    codeSnippet: "public class Sensor {\n    boolean isActive; // Not explicitly assigned\n}",
    options: [
      { id: "opt-a", text: "true" },
      { id: "opt-b", text: "false" },
      { id: "opt-c", text: "null" },
      { id: "opt-d", text: "undefined" }
    ],
    correctAnswer: "opt-b",
    explanation: "Java initializes numeric instance fields to 0, object references to null, and boolean fields to false by default.",
    isActive: true
  },
  {
    id: "q-co-06",
    topicId: "classes-objects",
    topic: "Classes & Objects",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Variables declared directly inside a class but outside any method are known as ________ variables.",
    codeSnippet: "public class User {\n    String username; // Declared at class scope\n}",
    acceptedAnswers: ["instance", "instance variables", "field", "fields", "member", "member variables"],
    explanation: "Variables declared at class level outside methods define the state of objects and are called instance variables or fields.",
    isActive: true
  },

  // --- TOPIC: constructors ---
  {
    id: "q-con-01",
    topicId: "constructors",
    topic: "Constructors & Overloading",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "What return type must be specified in the method signature when declaring a Java constructor?",
    codeSnippet: "public _____ Book(String title) {\n    this.title = title;\n}",
    options: [
      { id: "opt-a", text: "void" },
      { id: "opt-b", text: "Object" },
      { id: "opt-c", text: "No return type at all (not even void)" },
      { id: "opt-d", text: "The name of the class" }
    ],
    correctAnswer: "opt-c",
    explanation: "Constructors in Java do not have any return type, not even void. Declaring a return type turns it into a regular method.",
    isActive: true
  },
  {
    id: "q-con-02",
    topicId: "constructors",
    topic: "Constructors & Overloading",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which keyword allows one constructor to call another constructor within the same class?",
    codeSnippet: "public Circle() {\n    _____(1.0); // Calls Circle(double radius)\n}",
    acceptedAnswers: ["this", "this()", "`this`"],
    explanation: "this(...) is used for explicit constructor chaining within the same class and must be the first line of the constructor body.",
    isActive: true
  },
  {
    id: "q-con-03",
    topicId: "constructors",
    topic: "Constructors & Overloading",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "What happens if a developer defines a parameterized constructor in a class but does NOT provide a no-argument constructor?",
    codeSnippet: "class Laptop {\n    Laptop(String brand) { ... }\n}\nLaptop l = new Laptop(); // Will this compile?",
    options: [
      { id: "opt-a", text: "The compiler still provides the default no-argument constructor automatically" },
      { id: "opt-b", text: "Compilation fails because the default no-argument constructor is no longer generated" },
      { id: "opt-c", text: "It compiles but throws an InstantiationException at runtime" },
      { id: "opt-d", text: "The object is created with null for all fields" }
    ],
    correctAnswer: "opt-b",
    explanation: "Once any custom constructor is explicitly defined in a class, Java stops providing the default parameterless constructor.",
    isActive: true
  },
  {
    id: "q-con-04",
    topicId: "constructors",
    topic: "Constructors & Overloading",
    questionType: "SCENARIO",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "A Point class needs to support creation with default coordinates (0, 0) or specific (x, y) coordinates provided by the caller. How does Constructor Overloading solve this?",
    codeSnippet: "Point p1 = new Point();       // (0, 0)\nPoint p2 = new Point(15, 25); // (15, 25)",
    expectedKeywords: ["constructor overloading", "multiple constructors", "different parameters", "different argument lists", "this"],
    gradingRubric: "Must mention defining multiple constructors with differing parameter lists (overloading) to allow flexible object initialization.",
    explanation: "Constructor overloading allows a class to declare multiple constructors with different argument types/counts to provide varied initialization choices.",
    isActive: true
  },
  {
    id: "q-con-05",
    topicId: "constructors",
    topic: "Constructors & Overloading",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Where must a constructor call to another constructor using this() or super() be placed inside a constructor body?",
    codeSnippet: "public Student(int id) {\n    System.out.println(\"Init\");\n    this(id, \"Unknown\"); // Line position valid?\n}",
    options: [
      { id: "opt-a", text: "Anywhere within the constructor body" },
      { id: "opt-b", text: "As the very first statement in the constructor body" },
      { id: "opt-c", text: "At the very end of the constructor body" },
      { id: "opt-d", text: "Inside a static initializer block" }
    ],
    correctAnswer: "opt-b",
    explanation: "Java language rules mandate that an explicit constructor invocation (this() or super()) must be the first statement in the constructor.",
    isActive: true
  },
  {
    id: "q-con-06",
    topicId: "constructors",
    topic: "Constructors & Overloading",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Constructor ________ allows a class to have multiple constructors with the same name but different parameter lists.",
    codeSnippet: "public Box() { ... }\npublic Box(double width) { ... }\npublic Box(double w, double h, double d) { ... }",
    acceptedAnswers: ["overloading", "constructor overloading"],
    explanation: "Constructor overloading provides multiple ways to initialize an object depending on the supplied arguments.",
    isActive: true
  },

  // --- TOPIC: encapsulation ---
  {
    id: "q-enc-01",
    topicId: "encapsulation",
    topic: "Encapsulation & Access Modifiers",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which access modifier in Java restricts member visibility exclusively to within the declaring class itself?",
    codeSnippet: "public class BankVault {\n    _____ double reserveBalance;\n}",
    options: [
      { id: "opt-a", text: "protected" },
      { id: "opt-b", text: "package-private (default)" },
      { id: "opt-c", text: "private" },
      { id: "opt-d", text: "public" }
    ],
    correctAnswer: "opt-c",
    explanation: "The 'private' modifier hides member fields from all other classes, including subclasses and package members, enforcing encapsulation.",
    isActive: true
  },
  {
    id: "q-enc-02",
    topicId: "encapsulation",
    topic: "Encapsulation & Access Modifiers",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Methods used to inspect and retrieve the value of a private field are commonly called ________ methods.",
    codeSnippet: "public String getName() {\n    return this.name;\n}",
    acceptedAnswers: ["getter", "getters", "accessor", "accessors", "getter methods"],
    explanation: "Getter (accessor) methods return the internal private state without granting direct write access to external code.",
    isActive: true
  },
  {
    id: "q-enc-03",
    topicId: "encapsulation",
    topic: "Encapsulation & Access Modifiers",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "What is the primary architectural purpose of Encapsulation in object-oriented software engineering?",
    codeSnippet: "// Encapsulated design:\n// Private data + Public validated access methods",
    options: [
      { id: "opt-a", text: "To maximize code execution speed by disabling runtime type checks" },
      { id: "opt-b", text: "To bundle data with operations and protect internal state from unauthorized direct manipulation" },
      { id: "opt-c", text: "To allow every class in the project to modify fields directly" },
      { id: "opt-d", text: "To force every class to inherit from java.lang.Thread" }
    ],
    correctAnswer: "opt-b",
    explanation: "Encapsulation hides internal implementation details and protects object state from illegal direct modifications via controlled public methods.",
    isActive: true
  },
  {
    id: "q-enc-04",
    topicId: "encapsulation",
    topic: "Encapsulation & Access Modifiers",
    questionType: "SCENARIO",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "A BankAccount class contains a balance variable. Why is declaring 'public double balance;' bad practice, and how does encapsulation prevent negative balances?",
    codeSnippet: "public class BankAccount {\n    // How should balance be safeguarded?\n}",
    expectedKeywords: ["private", "validation", "setter", "deposit", "withdraw", "data hiding", "negative"],
    gradingRubric: "Must explain that public fields allow any code to set invalid values like -500; private field with setter/withdraw validates constraints before modifying state.",
    explanation: "Declaring balance private forces callers to use methods like withdraw() where validation logic (amount <= balance && amount > 0) maintains domain integrity.",
    isActive: true
  },
  {
    id: "q-enc-05",
    topicId: "encapsulation",
    topic: "Encapsulation & Access Modifiers",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "If a member in a class has NO access modifier specified (package-private), which classes can access it?",
    codeSnippet: "class Server {\n    int port = 8080; // No modifier specified\n}",
    options: [
      { id: "opt-a", text: "Only the declaring class itself" },
      { id: "opt-b", text: "Any class located within the same package" },
      { id: "opt-c", text: "Any subclass in any package across the entire JVM" },
      { id: "opt-d", text: "Every class in the application without restriction" }
    ],
    correctAnswer: "opt-b",
    explanation: "Default access (no keyword) is package-private: visible to any class residing inside the same package, but hidden from classes outside.",
    isActive: true
  },
  {
    id: "q-enc-06",
    topicId: "encapsulation",
    topic: "Encapsulation & Access Modifiers",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Methods used to modify or update the value of a private field while enforcing validation are called ________ methods.",
    codeSnippet: "public void setAge(int age) {\n    if (age > 0) this.age = age;\n}",
    acceptedAnswers: ["setter", "setters", "mutator", "mutators", "setter methods"],
    explanation: "Setter (mutator) methods control mutations to encapsulated private state and prevent illegal assignments.",
    isActive: true
  },

  // --- TOPIC: inheritance ---
  {
    id: "q-inh-01",
    topicId: "inheritance",
    topic: "Inheritance & Class Hierarchies",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which Java keyword is used by a subclass to establish inheritance from a superclass?",
    codeSnippet: "public class Dog _____ Animal {\n    // Subclass definition\n}",
    options: [
      { id: "opt-a", text: "implements" },
      { id: "opt-b", text: "extends" },
      { id: "opt-c", text: "inherits" },
      { id: "opt-d", text: "super" }
    ],
    correctAnswer: "opt-b",
    explanation: "The 'extends' keyword is used to derive a class from a parent superclass in Java.",
    isActive: true
  },
  {
    id: "q-inh-02",
    topicId: "inheritance",
    topic: "Inheritance & Class Hierarchies",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Inheritance models the ________ relationship between classes (such as Dog is an Animal).",
    codeSnippet: "class Dog extends Animal {} // Dog _____ Animal",
    acceptedAnswers: ["is-a", "isa", "is a", "is a relationship", "is-a relationship"],
    explanation: "Inheritance models the IS-A relationship, where a specialized subclass is a type of its general superclass.",
    isActive: true
  },
  {
    id: "q-inh-03",
    topicId: "inheritance",
    topic: "Inheritance & Class Hierarchies",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which keyword allows a subclass to invoke an overridden method or constructor of its immediate parent class?",
    codeSnippet: "public class Manager extends Employee {\n    public void work() {\n        _____.work(); // Calls Employee.work()\n    }\n}",
    options: [
      { id: "opt-a", text: "this" },
      { id: "opt-b", text: "parent" },
      { id: "opt-c", text: "super" },
      { id: "opt-d", text: "base" }
    ],
    correctAnswer: "opt-c",
    explanation: "The 'super' keyword refers to the superclass members, allowing subclasses to call parent methods or constructors.",
    isActive: true
  },
  {
    id: "q-inh-04",
    topicId: "inheritance",
    topic: "Inheritance & Class Hierarchies",
    questionType: "SCENARIO",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "A software application models 'Employee', 'Manager', and 'Executive'. How does inheritance reduce code duplication across these roles?",
    codeSnippet: "// Common: id, name, salary, login()\n// Specific: bonus, approveBudget()",
    expectedKeywords: ["inheritance", "extends", "code reuse", "super class", "base class", "common attributes", "is-a"],
    gradingRubric: "Must mention defining common fields (id, name, salary) in a shared Employee base class so subclasses inherit them without rewriting.",
    explanation: "Inheritance enables code reusability: shared fields and methods are written once in Employee, and Manager inherits them while adding role-specific behavior.",
    isActive: true
  },
  {
    id: "q-inh-05",
    topicId: "inheritance",
    topic: "Inheritance & Class Hierarchies",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Does Java support multiple inheritance of stateful classes (i.e. class C extends A, B)?",
    codeSnippet: "class A {}\nclass B {}\nclass C extends A, B {} // Valid in Java?",
    options: [
      { id: "opt-a", text: "Yes, Java permits multiple class inheritance without limits" },
      { id: "opt-b", text: "No, Java prohibits multiple inheritance of classes to prevent the diamond ambiguity problem" },
      { id: "opt-c", text: "Yes, but only if both classes are declared static" },
      { id: "opt-d", text: "Yes, but only if all fields are public" }
    ],
    correctAnswer: "opt-b",
    explanation: "Java does not support multiple class inheritance to avoid ambiguity (the diamond problem). Multiple inheritance is achieved via interfaces.",
    isActive: true
  },
  {
    id: "q-inh-06",
    topicId: "inheritance",
    topic: "Inheritance & Class Hierarchies",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "In Java, every class that does not explicitly extend another class automatically inherits directly from java.lang.________.",
    codeSnippet: "public class Sample {\n    // Implicitly extends which class?\n}",
    acceptedAnswers: ["Object", "`Object`", "java.lang.Object"],
    explanation: "java.lang.Object is the universal root superclass of every class in the Java type hierarchy.",
    isActive: true
  },

  // --- TOPIC: polymorphism ---
  {
    id: "q-poly-01",
    topicId: "polymorphism",
    topic: "Polymorphism & Method Overriding",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which concept allows a parent class reference variable to hold a child class object and execute the child's overridden method at runtime?",
    codeSnippet: "Animal a = new Dog();\na.makeSound(); // Executes Dog's makeSound() method",
    options: [
      { id: "opt-a", text: "Encapsulation" },
      { id: "opt-b", text: "Polymorphism (Dynamic Method Dispatch)" },
      { id: "opt-c", text: "Static Compilation" },
      { id: "opt-d", text: "Garbage Collection" }
    ],
    correctAnswer: "opt-b",
    explanation: "Dynamic Method Dispatch (Runtime Polymorphism) ensures that the method call on a superclass reference invokes the concrete overridden version.",
    isActive: true
  },
  {
    id: "q-poly-02",
    topicId: "polymorphism",
    topic: "Polymorphism & Method Overriding",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "When a subclass provides its own specific implementation of a method already declared in its superclass with the exact same signature, it is called method ________.",
    codeSnippet: "class Child extends Parent {\n    @Override\n    public void display() { ... }\n}",
    acceptedAnswers: ["overriding", "override", "method overriding"],
    explanation: "Method overriding replaces the superclass implementation with a subclass-specific behavior for the same method signature.",
    isActive: true
  },
  {
    id: "q-poly-03",
    topicId: "polymorphism",
    topic: "Polymorphism & Method Overriding",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "What distinguishes Method Overloading from Method Overriding in Java?",
    codeSnippet: "// A: int calc(int a) vs int calc(int a, int b)\n// B: void draw() in Parent vs void draw() in Child",
    options: [
      { id: "opt-a", text: "Overloading occurs within the same class with different parameters; Overriding occurs in a subclass with the same signature" },
      { id: "opt-b", text: "Overloading requires the @Override annotation; Overriding does not" },
      { id: "opt-c", text: "Overloading happens at runtime; Overriding is resolved exclusively at compile-time" },
      { id: "opt-d", text: "Overloading requires private methods; Overriding requires public methods" }
    ],
    correctAnswer: "opt-a",
    explanation: "Overloading has the same method name but different parameter lists in the same class (compile-time). Overriding alters a parent method in a subclass (runtime).",
    isActive: true
  },
  {
    id: "q-poly-04",
    topicId: "polymorphism",
    topic: "Polymorphism & Method Overriding",
    questionType: "SCENARIO",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "A graphics rendering system maintains a list of Shape references (Circle, Rectangle, Triangle). How does polymorphism allow calling shape.draw() in a loop without knowing the concrete type beforehand?",
    codeSnippet: "List<Shape> shapes = List.of(new Circle(), new Rectangle());\nfor (Shape s : shapes) {\n    s.draw(); // How does this work?\n}",
    expectedKeywords: ["polymorphism", "dynamic dispatch", "runtime", "override", "interface", "concrete", "draw"],
    gradingRubric: "Must explain that the Shape reference dynamically resolves to the concrete object's overridden draw() method at runtime via dynamic dispatch.",
    explanation: "Polymorphism enables treating divergent objects uniformly via a base Shape reference, while the JVM dynamically dispatches to each object's actual draw() method at runtime.",
    isActive: true
  },
  {
    id: "q-poly-05",
    topicId: "polymorphism",
    topic: "Polymorphism & Method Overriding",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which annotation is recommended in Java when redefining a parent method in a subclass to have the compiler verify the signature?",
    codeSnippet: "class Derived extends Base {\n    _____ \n    public void execute() { ... }\n}",
    options: [
      { id: "opt-a", text: "@Overload" },
      { id: "opt-b", text: "@Override" },
      { id: "opt-c", text: "@Inherit" },
      { id: "opt-d", text: "@Polymorphic" }
    ],
    correctAnswer: "opt-b",
    explanation: "The @Override annotation asks the compiler to check that the method actually overrides a superclass method, catching typos.",
    isActive: true
  },
  {
    id: "q-poly-06",
    topicId: "polymorphism",
    topic: "Polymorphism & Method Overriding",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Method overloading is an example of compile-time or ________ polymorphism.",
    codeSnippet: "math.add(5, 10);\nmath.add(5.5, 10.5); // Resolved at compile time",
    acceptedAnswers: ["static", "static polymorphism"],
    explanation: "Method overloading is resolved at compile time based on parameter types and is known as static polymorphism.",
    isActive: true
  },

  // --- TOPIC: abstraction ---
  {
    id: "q-abs-01",
    topicId: "abstraction",
    topic: "Abstraction & Abstract Classes",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Can an abstract class in Java be directly instantiated using the 'new' keyword?",
    codeSnippet: "public abstract class Vehicle { ... }\nVehicle v = new Vehicle(); // Is this valid?",
    options: [
      { id: "opt-a", text: "Yes, as long as it has no abstract methods" },
      { id: "opt-b", text: "No, abstract classes cannot be directly instantiated" },
      { id: "opt-c", text: "Yes, but only if all members are public" },
      { id: "opt-d", text: "Yes, if cast to an Object" }
    ],
    correctAnswer: "opt-b",
    explanation: "Abstract classes cannot be instantiated with 'new'. They can only be subclassed by concrete classes that implement their abstract methods.",
    isActive: true
  },
  {
    id: "q-abs-02",
    topicId: "abstraction",
    topic: "Abstraction & Abstract Classes",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "A method declared without a method body (no curly braces, ending with a semicolon) in an abstract class must use the ________ keyword.",
    codeSnippet: "public _____ void calculateArea();",
    acceptedAnswers: ["abstract", "`abstract`"],
    explanation: "The 'abstract' keyword defines a method header that leaves the implementation to concrete subclasses.",
    isActive: true
  },
  {
    id: "q-abs-03",
    topicId: "abstraction",
    topic: "Abstraction & Abstract Classes",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Can an abstract class in Java contain non-abstract (concrete) methods with bodies, constructors, and instance fields?",
    codeSnippet: "public abstract class Account {\n    private double balance;\n    public Account() { balance = 0; } // Constructor\n    public double getBalance() { return balance; } // Concrete method\n}",
    options: [
      { id: "opt-a", text: "Yes, abstract classes can have constructors, fields, and fully implemented concrete methods" },
      { id: "opt-b", text: "No, abstract classes may only contain method headers without bodies" },
      { id: "opt-c", text: "No, abstract classes cannot have constructors" },
      { id: "opt-d", text: "No, abstract classes cannot store state in fields" }
    ],
    correctAnswer: "opt-a",
    explanation: "Unlike pure interfaces in early Java, abstract classes can have constructors (called via super()), instance variables, and concrete methods.",
    isActive: true
  },
  {
    id: "q-abs-04",
    topicId: "abstraction",
    topic: "Abstraction & Abstract Classes",
    questionType: "SCENARIO",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Why is Abstraction beneficial when designing a complex subsystem like a DatabaseConnector, where callers execute queries without knowing the underlying network socket protocols?",
    codeSnippet: "// Caller: db.query(\"SELECT * FROM users\");\n// Hidden: TCP packets, SSL handshake, socket buffers",
    expectedKeywords: ["abstraction", "hiding details", "hide complexity", "simplify", "interface", "implementation", "separation"],
    gradingRubric: "Must mention that abstraction hides low-level internal complexity (sockets/handshakes) and presents a clean, simple high-level interface to the caller.",
    explanation: "Abstraction isolates users from complex low-level implementation details, exposing only meaningful essential operations and making systems easier to use and maintain.",
    isActive: true
  },
  {
    id: "q-abs-05",
    topicId: "abstraction",
    topic: "Abstraction & Abstract Classes",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "If a regular class extends an abstract class containing two abstract methods, what must the subclass do to compile successfully?",
    codeSnippet: "abstract class Parent {\n    abstract void step1();\n    abstract void step2();\n}\nclass Child extends Parent { ... }",
    options: [
      { id: "opt-a", text: "It must implement at least one of the abstract methods" },
      { id: "opt-b", text: "It must provide implementations for all inherited abstract methods, or be declared abstract itself" },
      { id: "opt-c", text: "It can leave them empty; Java synthesizes default returns" },
      { id: "opt-d", text: "It must redeclare them with the native keyword" }
    ],
    correctAnswer: "opt-b",
    explanation: "A concrete subclass must implement every abstract method inherited from its parent class, or it must also be marked abstract.",
    isActive: true
  },
  {
    id: "q-abs-06",
    topicId: "abstraction",
    topic: "Abstraction & Abstract Classes",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Abstraction focuses on what an object ________ rather than how it does it internally.",
    codeSnippet: "// Exposes interface (WHAT), hides implementation (HOW)",
    acceptedAnswers: ["does", "can do"],
    explanation: "Abstraction emphasizes the behavior and interface (what an object does) rather than internal mechanics (how).",
    isActive: true
  },

  // --- TOPIC: interfaces ---
  {
    id: "q-if-01",
    topicId: "interfaces",
    topic: "Interfaces & Contracts",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which keyword does a Java class use to declare that it fulfills an interface contract?",
    codeSnippet: "public class AudioPlayer _____ Playable {\n    public void play() { ... }\n}",
    options: [
      { id: "opt-a", text: "extends" },
      { id: "opt-b", text: "implements" },
      { id: "opt-c", text: "inherits" },
      { id: "opt-d", text: "interface" }
    ],
    correctAnswer: "opt-b",
    explanation: "Classes use the 'implements' keyword to realize and fulfill contracts defined by Java interfaces.",
    isActive: true
  },
  {
    id: "q-if-02",
    topicId: "interfaces",
    topic: "Interfaces & Contracts",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Unlike classes, a Java class can implement ________ (one / multiple) interfaces simultaneously.",
    codeSnippet: "public class SmartDevice implements Wireless, Rechargeable, Bluetooth { ... }",
    acceptedAnswers: ["multiple", "many", "several"],
    explanation: "Java allows a class to implement multiple interfaces, providing a clean mechanism for multiple behavioral inheritance.",
    isActive: true
  },
  {
    id: "q-if-03",
    topicId: "interfaces",
    topic: "Interfaces & Contracts",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "By default, what are the implicit modifiers for all fields declared inside a Java interface?",
    codeSnippet: "public interface Constants {\n    int MAX_RETRIES = 5; // What modifiers are applied automatically?\n}",
    options: [
      { id: "opt-a", text: "private transient" },
      { id: "opt-b", text: "public static final" },
      { id: "opt-c", text: "protected volatile" },
      { id: "opt-d", text: "package-private" }
    ],
    correctAnswer: "opt-b",
    explanation: "Every field declared in a Java interface is implicitly public, static, and final (constant), whether explicitly stated or not.",
    isActive: true
  },
  {
    id: "q-if-04",
    topicId: "interfaces",
    topic: "Interfaces & Contracts",
    questionType: "SCENARIO",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "An e-commerce system needs to support multiple payment gateways (Stripe, PayPal, ApplePay) without changing the OrderService class. How does defining a PaymentProcessor interface achieve loose coupling?",
    codeSnippet: "public class OrderService {\n    private PaymentProcessor processor; // Interface reference\n    public void checkout(double amt) { processor.pay(amt); }\n}",
    expectedKeywords: ["interface", "loose coupling", "decoupling", "polymorphism", "contract", "interchangeable", "flexible"],
    gradingRubric: "Must mention that OrderService depends on the interface contract rather than concrete vendor classes, allowing new gateways to be added seamlessly.",
    explanation: "Coding to an interface contract (PaymentProcessor) decouples OrderService from specific gateway classes, allowing new implementations to be plugged in without modifying OrderService.",
    isActive: true
  },
  {
    id: "q-if-05",
    topicId: "interfaces",
    topic: "Interfaces & Contracts",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Starting in Java 8, which keyword allows an interface to provide a method with a concrete default implementation body?",
    codeSnippet: "public interface Logger {\n    _____ void logInfo(String msg) {\n        System.out.println(\"[INFO] \" + msg);\n    }\n}",
    options: [
      { id: "opt-a", text: "static" },
      { id: "opt-b", text: "default" },
      { id: "opt-c", text: "concrete" },
      { id: "opt-d", text: "virtual" }
    ],
    correctAnswer: "opt-b",
    explanation: "The 'default' keyword enables interfaces to define method implementations without breaking backwards compatibility for existing implementing classes.",
    isActive: true
  },
  {
    id: "q-if-06",
    topicId: "interfaces",
    topic: "Interfaces & Contracts",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "An interface in Java defines a contract consisting of ________ signatures that implementing classes agree to provide.",
    codeSnippet: "public interface Printable {\n    void print(); // Contract signature\n}",
    acceptedAnswers: ["method", "methods", "method signatures"],
    explanation: "Interfaces specify what methods a class must implement without dictating the internal algorithmic code.",
    isActive: true
  },

  // --- TOPIC: oop-keywords ---
  {
    id: "q-kw-01",
    topicId: "oop-keywords",
    topic: "OOP Keywords & Object Class",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "What is the consequence of applying the 'final' keyword to a class declaration in Java?",
    codeSnippet: "public final class SecurityKey {\n    // Class definition\n}",
    options: [
      { id: "opt-a", text: "The class cannot be instantiated" },
      { id: "opt-b", text: "The class cannot be extended or subclassed by any other class" },
      { id: "opt-c", text: "All methods in the class become private" },
      { id: "opt-d", text: "The class runs in a background thread" }
    ],
    correctAnswer: "opt-b",
    explanation: "A 'final' class cannot be extended (e.g. java.lang.String is final to preserve immutability and security).",
    isActive: true
  },
  {
    id: "q-kw-02",
    topicId: "oop-keywords",
    topic: "OOP Keywords & Object Class",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Applying the 'final' keyword to an instance variable makes its value ________ once initialized.",
    codeSnippet: "public final double PI = 3.14159; // Value cannot be modified",
    acceptedAnswers: ["constant", "immutable", "unchangeable", "fixed"],
    explanation: "A final variable acts as a constant: once assigned, its value reference cannot be altered.",
    isActive: true
  },
  {
    id: "q-kw-03",
    topicId: "oop-keywords",
    topic: "OOP Keywords & Object Class",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Which method inherited from java.lang.Object is commonly overridden to return a human-readable string representation of an object?",
    codeSnippet: "Student s = new Student(\"Sara\", 101);\nSystem.out.println(s); // Invokes which method?",
    options: [
      { id: "opt-a", text: "print()" },
      { id: "opt-b", text: "toString()" },
      { id: "opt-c", text: "asString()" },
      { id: "opt-d", text: "describe()" }
    ],
    correctAnswer: "opt-b",
    explanation: "toString() returns a string representation of the object and is automatically called when passing an object to System.out.println.",
    isActive: true
  },
  {
    id: "q-kw-04",
    topicId: "oop-keywords",
    topic: "OOP Keywords & Object Class",
    questionType: "SCENARIO",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "Explain the difference between the equality operator (==) and the .equals() method when comparing two separate String objects containing identical text.",
    codeSnippet: "String s1 = new String(\"Java\");\nString s2 = new String(\"Java\");\n// s1 == s2 vs s1.equals(s2)",
    expectedKeywords: ["==", "equals", "reference", "memory address", "content", "value", "state"],
    gradingRubric: "Must state that == compares object memory references/addresses, while .equals() compares the actual text content/values.",
    explanation: "The == operator checks whether both references point to the exact same memory location on the heap, whereas .equals() evaluates whether the content values are equivalent.",
    isActive: true
  },
  {
    id: "q-kw-05",
    topicId: "oop-keywords",
    topic: "OOP Keywords & Object Class",
    questionType: "MCQ",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "What does the HAS-A relationship represent in Java OOP design (as opposed to IS-A)?",
    codeSnippet: "public class Car {\n    private Engine engine; // Car HAS-A Engine\n}",
    options: [
      { id: "opt-a", text: "Inheritance through extends" },
      { id: "opt-b", text: "Composition / Aggregation where a class holds a reference to another class" },
      { id: "opt-c", text: "Method overriding" },
      { id: "opt-d", text: "Package access control" }
    ],
    correctAnswer: "opt-b",
    explanation: "HAS-A represents composition/aggregation (containment), where an object contains references to other objects (e.g., a Car has an Engine).",
    isActive: true
  },
  {
    id: "q-kw-06",
    topicId: "oop-keywords",
    topic: "OOP Keywords & Object Class",
    questionType: "FILL_BLANK",
    difficulty: "NORMAL",
    marks: 1,
    questionText: "A method declared with the ________ keyword cannot be overridden by any subclass.",
    codeSnippet: "public _____ void lockFirmware() {\n    // Subclasses cannot override this logic\n}",
    acceptedAnswers: ["final", "`final`"],
    explanation: "Final methods cannot be overridden by subclasses, preventing alteration of critical algorithms.",
    isActive: true
  }
];

// Pre-seeded Attendance Roster
export const DEFAULT_ATTENDANCE = [
  // 25-CP Batch
  { rollNumber: "25-CP-001", studentName: "Ali Khan", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-002", studentName: "Sara Ahmed", isPresent: false, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-003", studentName: "Ahmed Raza", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-004", studentName: "Fatima Noor", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-005", studentName: "Bilal Tariq", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-006", studentName: "Zainab Malik", isPresent: false, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-007", studentName: "Hamza Siddiqui", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-008", studentName: "Ayesha Javed", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-009", studentName: "Usman Ghani", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "25-CP-010", studentName: "Maryam Bibi", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  // Backward-compatible 23-CP records
  { rollNumber: "23-CP-001", studentName: "Alex Mercer", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "23-CP-002", studentName: "Zara Chen", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "23-CP-003", studentName: "Marcus Vance", isPresent: false, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "23-CP-004", studentName: "Elena Rostova", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" },
  { rollNumber: "23-CP-005", studentName: "Devon Park", isPresent: true, markedAt: "2026-10-02T08:00:00.000Z" }
];

export const INITIAL_DATA = {
  settings: {
    quizTitle: "JAVA OOP // CODE CHALLENGE",
    subtitle: "Object-Oriented Programming Assessment",
    durationMinutes: 10,
    passingPercentage: 60,
    maxViolations: 1,
    fullscreenRequired: true,
    tabSwitchTerminate: true,
    copyPasteDisabled: true,
    rightClickDisabled: true,
    autoSubmit: true,
    rollPrefix: "25-CP", // Instructor configurable prefix
    universityEmailDomain: "uettaxila.edu.pk", // Instructor email domain
    minTopics: 2,
    totalQuestions: 10,
    showResultImmediately: true,
    allowAnswerReview: false,
    strictMode: true,
    quizActive: true
  },
  instructors: [
    {
      id: "inst-001",
      name: "Dr. Naveed Khan",
      email: "naveed.khan@uettaxila.edu.pk",
      role: "Lead Java Examiner",
      department: "Department of Computer Science & Software Engineering",
      isActive: true
    }
  ],
  instructorTemporaryPasswords: [],
  instructorSessions: [],
  authRateLimits: {
    failedAttempts: {},
    requestCooldown: {}
  },
  topics: DEFAULT_TOPICS,
  questions: QUESTION_BANK,
  attendance: DEFAULT_ATTENDANCE,
  quizAttempts: [],
  answers: [],
  securityEvents: []
};

export const DEFAULT_INSTRUCTORS = INITIAL_DATA.instructors;

class QuizDatabase {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        this.writeAll(INITIAL_DATA);
      } else {
        // Upgrade existing database if missing topics, attendance, or instructor auth
        const data = this.readAll();
        let needsUpdate = false;
        if (!data.topics || data.topics.length === 0) {
          data.topics = DEFAULT_TOPICS;
          needsUpdate = true;
        }
        if (!data.attendance || data.attendance.length === 0) {
          data.attendance = DEFAULT_ATTENDANCE;
          needsUpdate = true;
        }
        if (!data.questions || data.questions.length < 20) {
          data.questions = QUESTION_BANK;
          needsUpdate = true;
        }
        if (!data.settings.rollPrefix) {
          data.settings.rollPrefix = "25-CP";
          data.settings.minTopics = 2;
          data.settings.totalQuestions = 10;
          data.settings.quizActive = true;
          needsUpdate = true;
        }
        if (data.settings.universityEmailDomain !== "uettaxila.edu.pk") {
          data.settings.universityEmailDomain = "uettaxila.edu.pk";
          needsUpdate = true;
        }
        // Force single authorized instructor in DB
        data.instructors = DEFAULT_INSTRUCTORS;
        needsUpdate = true;

        if (!data.instructorTemporaryPasswords) {
          data.instructorTemporaryPasswords = [];
          needsUpdate = true;
        }
        if (!data.instructorSessions) {
          data.instructorSessions = [];
          needsUpdate = true;
        }
        if (!data.authRateLimits) {
          data.authRateLimits = { failedAttempts: {}, requestCooldown: {} };
          needsUpdate = true;
        }
        if (data.admin) {
          delete data.admin;
          needsUpdate = true;
        }
        if (needsUpdate) {
          this.writeAll(data);
        }
      }
    } catch (e) {
      console.error('Error initializing database file:', e);
    }
  }

  readAll() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        this.writeAll(INITIAL_DATA);
        return INITIAL_DATA;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed reading database, returning initial fallback:', err);
      return INITIAL_DATA;
    }
  }

  writeAll(data) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(TMP_FILE, DB_FILE);
    } catch (err) {
      console.error('Failed writing database:', err);
      throw err;
    }
  }

  // --- Roll Number Format Validation ---
  validateRollNumberFormat(rollNumber) {
    if (!rollNumber) return false;
    const clean = rollNumber.trim().toUpperCase();
    // Format requirement: YY-CP-NNN
    const pattern = /^\d{2}-CP-\d{3}$/;
    return pattern.test(clean);
  }

  // --- Attendance Verification ---
  checkStudentAttendance(rollNumber) {
    const data = this.readAll();
    const cleanRoll = (rollNumber || '').trim().toUpperCase();
    const record = (data.attendance || []).find(
      a => a.rollNumber.toUpperCase() === cleanRoll
    );
    if (!record) {
      return { found: false, isPresent: false, record: null };
    }
    return { found: true, isPresent: !!record.isPresent, record };
  }

  getAttendanceRoster() {
    const data = this.readAll();
    return data.attendance || [];
  }

  setAttendanceRecord(rollNumber, studentName, isPresent = true) {
    const data = this.readAll();
    const cleanRoll = rollNumber.trim().toUpperCase();
    if (!data.attendance) data.attendance = [];

    const existingIdx = data.attendance.findIndex(a => a.rollNumber.toUpperCase() === cleanRoll);
    if (existingIdx >= 0) {
      data.attendance[existingIdx].isPresent = isPresent;
      if (studentName) data.attendance[existingIdx].studentName = studentName.trim();
      data.attendance[existingIdx].markedAt = new Date().toISOString();
    } else {
      data.attendance.push({
        rollNumber: cleanRoll,
        studentName: studentName ? studentName.trim() : `Student ${cleanRoll}`,
        isPresent: isPresent,
        markedAt: new Date().toISOString()
      });
    }
    this.writeAll(data);
    return true;
  }

  parseAndSaveAttendancePaste(pasteText) {
    const lines = (pasteText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const data = this.readAll();
    if (!data.attendance) data.attendance = [];

    let count = 0;
    for (const line of lines) {
      // Could be '25-CP-001' or '25-CP-001,Ali Khan' or '25-CP-001 Ali Khan'
      let roll = line;
      let name = '';
      if (line.includes(',')) {
        const parts = line.split(',');
        roll = parts[0].trim();
        name = parts.slice(1).join(',').trim();
      } else if (line.includes('\t')) {
        const parts = line.split('\t');
        roll = parts[0].trim();
        name = parts[1] ? parts[1].trim() : '';
      }

      const cleanRoll = roll.toUpperCase();
      if (/^\d{2}-CP-\d{3}$/.test(cleanRoll)) {
        const existingIdx = data.attendance.findIndex(a => a.rollNumber.toUpperCase() === cleanRoll);
        if (existingIdx >= 0) {
          data.attendance[existingIdx].isPresent = true;
          if (name) data.attendance[existingIdx].studentName = name;
          data.attendance[existingIdx].markedAt = new Date().toISOString();
        } else {
          data.attendance.push({
            rollNumber: cleanRoll,
            studentName: name || `Student ${cleanRoll}`,
            isPresent: true,
            markedAt: new Date().toISOString()
          });
        }
        count++;
      }
    }
    this.writeAll(data);
    return count;
  }

  toggleAttendance(rollNumber) {
    const data = this.readAll();
    const cleanRoll = rollNumber.trim().toUpperCase();
    const item = (data.attendance || []).find(a => a.rollNumber.toUpperCase() === cleanRoll);
    if (item) {
      item.isPresent = !item.isPresent;
      item.markedAt = new Date().toISOString();
      this.writeAll(data);
      return item;
    }
    return null;
  }

  // --- Topic Library Operations ---
  getTopics() {
    const data = this.readAll();
    return data.topics || DEFAULT_TOPICS;
  }

  saveTopic(topicData) {
    const data = this.readAll();
    if (!data.topics) data.topics = DEFAULT_TOPICS;
    const idx = data.topics.findIndex(t => t.id === topicData.id);
    if (idx >= 0) {
      data.topics[idx] = { ...data.topics[idx], ...topicData };
    } else {
      data.topics.push({
        ...topicData,
        id: topicData.id || `top-${Date.now().toString(36)}`
      });
    }
    this.writeAll(data);
    return true;
  }

  // --- Attempt Management with Selected Topics & Dynamic Uniqueness ---
  getAttemptByRollNumber(rollNumber) {
    const data = this.readAll();
    const cleanRoll = (rollNumber || '').trim().toUpperCase();
    return data.quizAttempts.find(a => a.rollNumber.toUpperCase() === cleanRoll);
  }

  getAttemptById(attemptId) {
    const data = this.readAll();
    return data.quizAttempts.find(a => a.id === attemptId);
  }

  // Generate unique randomized question set based on selected topics
  createAttemptWithTopics({ rollNumber, studentName, selectedTopicIds, sessionId }) {
    const data = this.readAll();
    const cleanRoll = rollNumber.trim().toUpperCase();

    // Check if attempt already exists
    const existing = data.quizAttempts.find(a => a.rollNumber.toUpperCase() === cleanRoll);
    if (existing) {
      return existing;
    }

    const durationMinutes = data.settings.durationMinutes || 10;
    const totalQuestionsTarget = data.settings.totalQuestions || 10;
    const now = new Date();
    const deadline = new Date(now.getTime() + durationMinutes * 60 * 1000);

    // Filter questions by selected topics only
    const validTopicIds = Array.isArray(selectedTopicIds) && selectedTopicIds.length >= (data.settings.minTopics || 2)
      ? selectedTopicIds
      : (data.topics || DEFAULT_TOPICS).map(t => t.id);

    const eligibleQuestions = (data.questions || QUESTION_BANK).filter(
      q => q.isActive && validTopicIds.includes(q.topicId)
    );

    // Group eligible questions by topic
    const questionsByTopic = {};
    for (const tid of validTopicIds) {
      questionsByTopic[tid] = eligibleQuestions.filter(q => q.topicId === tid);
    }

    // Determine past question frequencies across existing attempts to maximize student uniqueness
    const questionUsageCount = {};
    for (const q of eligibleQuestions) {
      questionUsageCount[q.id] = 0;
    }
    for (const att of data.quizAttempts) {
      if (Array.isArray(att.questionOrder)) {
        for (const qid of att.questionOrder) {
          questionUsageCount[qid] = (questionUsageCount[qid] || 0) + 1;
        }
      }
    }

    // Balanced distribution: pick questions topic by topic
    const selectedQuestions = [];
    const questionsPerTopic = Math.max(1, Math.floor(totalQuestionsTarget / validTopicIds.length));
    
    // First pass: pick questionsPerTopic for each selected topic
    for (const tid of validTopicIds) {
      const topicPool = questionsByTopic[tid] || [];
      if (topicPool.length === 0) continue;

      // Sort topic pool by lowest usage count + random jitter
      const sortedPool = [...topicPool].sort((a, b) => {
        const scoreA = (questionUsageCount[a.id] || 0) + Math.random() * 0.5;
        const scoreB = (questionUsageCount[b.id] || 0) + Math.random() * 0.5;
        return scoreA - scoreB;
      });

      const countToTake = Math.min(questionsPerTopic, sortedPool.length);
      for (let i = 0; i < countToTake; i++) {
        selectedQuestions.push(sortedPool[i]);
      }
    }

    // Second pass: fill remaining slots up to totalQuestionsTarget from any selected topic
    const alreadySelectedIds = new Set(selectedQuestions.map(q => q.id));
    const remainingPool = eligibleQuestions
      .filter(q => !alreadySelectedIds.has(q.id))
      .sort((a, b) => {
        const scoreA = (questionUsageCount[a.id] || 0) + Math.random() * 0.5;
        const scoreB = (questionUsageCount[b.id] || 0) + Math.random() * 0.5;
        return scoreA - scoreB;
      });

    while (selectedQuestions.length < totalQuestionsTarget && remainingPool.length > 0) {
      selectedQuestions.push(remainingPool.shift());
    }

    // If still less than target (e.g. topic pool is small), use what is available
    // Shuffle the final question order for this candidate
    const shuffledQuestions = [...selectedQuestions].sort(() => Math.random() - 0.5);
    const questionIds = shuffledQuestions.map(q => q.id);

    // Map selected topic IDs to names for rich recording
    const topicMap = new Map((data.topics || DEFAULT_TOPICS).map(t => [t.id, t.name]));
    const selectedTopicNames = validTopicIds.map(tid => topicMap.get(tid) || tid);

    const attempt = {
      id: `att-${crypto.randomBytes(6).toString('hex')}`,
      studentId: `stu-${cleanRoll.replace(/[^A-Za-z0-9]/g, '')}`,
      rollNumber: cleanRoll,
      studentName: studentName.trim(),
      quizId: "java-oop-assessment-01",
      quizVersion: "2.0-dynamic-topics",
      startedAt: now.toISOString(),
      deadline: deadline.toISOString(),
      submittedAt: null,
      status: "IN_PROGRESS",
      score: 0,
      maxScore: shuffledQuestions.reduce((acc, q) => acc + (q.marks || 1), 0),
      percentage: 0,
      selectedTopicIds: validTopicIds,
      selectedTopics: selectedTopicNames,
      questionOrder: questionIds,
      securityStatus: "CLEAN",
      violationCount: 0,
      terminationReason: null,
      sessionId: sessionId || crypto.randomBytes(8).toString('hex'),
      lastActiveAt: now.toISOString()
    };

    data.quizAttempts.push(attempt);
    this.writeAll(data);
    return attempt;
  }

  // Retrieve sanitized questions for a student attempt (NO ANSWER KEYS)
  getQuestionsForStudentAttempt(attempt) {
    const data = this.readAll();
    const questionsMap = new Map((data.questions || QUESTION_BANK).map(q => [q.id, q]));
    const order = attempt.questionOrder || [];

    const studentQuestions = [];
    for (let i = 0; i < order.length; i++) {
      const qid = order[i];
      const q = questionsMap.get(qid);
      if (!q) continue;

      let safeOptions = null;
      if (q.options && Array.isArray(q.options)) {
        safeOptions = q.options.map(opt => ({ id: opt.id, text: opt.text }));
      }

      studentQuestions.push({
        id: q.id,
        orderNum: i + 1,
        topicId: q.topicId,
        topic: q.topic,
        questionType: q.questionType,
        difficulty: q.difficulty || "NORMAL",
        marks: q.marks || 1,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet || null,
        options: safeOptions
      });
    }

    return studentQuestions;
  }

  // --- Answers, Autosave & Strict Sequential Answering ---
  saveAnswer({ attemptId, questionId, studentAnswer }) {
    const data = this.readAll();
    const attempt = data.quizAttempts.find(a => a.id === attemptId);
    if (!attempt || attempt.status !== "IN_PROGRESS") {
      throw new Error("Assessment is locked or does not exist.");
    }

    // Check server deadline
    const now = Date.now();
    const deadlineMs = new Date(attempt.deadline).getTime();
    if (now > deadlineMs + 5000) {
      attempt.status = "TIME_EXPIRED";
      this.writeAll(data);
      throw new Error("Assessment time has expired.");
    }

    const existingAnsIdx = data.answers.findIndex(
      ans => ans.attemptId === attemptId && ans.questionId === questionId
    );

    const answerRecord = {
      id: existingAnsIdx >= 0 ? data.answers[existingAnsIdx].id : `ans-${crypto.randomBytes(6).toString('hex')}`,
      attemptId,
      questionId,
      studentAnswer: studentAnswer != null ? String(studentAnswer) : "",
      savedAt: new Date().toISOString()
    };

    if (existingAnsIdx >= 0) {
      data.answers[existingAnsIdx] = answerRecord;
    } else {
      data.answers.push(answerRecord);
    }

    this.writeAll(data);
    return answerRecord;
  }

  getAnswersForAttempt(attemptId) {
    const data = this.readAll();
    return data.answers.filter(a => a.attemptId === attemptId);
  }

  // --- Security Event Logging ---
  logSecurityEvent({ attemptId, rollNumber, studentName, eventType, details, severity = 'DETECTED' }) {
    const data = this.readAll();
    const attempt = data.quizAttempts.find(a => a.id === attemptId);

    const event = {
      id: `sec-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
      attemptId: attemptId || "pre-attempt",
      rollNumber: rollNumber || (attempt ? attempt.rollNumber : "UNKNOWN"),
      studentName: studentName || (attempt ? attempt.studentName : "UNKNOWN"),
      eventType,
      details: details || "",
      severity: severity || "DETECTED",
      timestamp: new Date().toISOString()
    };

    if (!data.securityEvents) data.securityEvents = [];
    data.securityEvents.unshift(event);

    if (attempt && attempt.status === "IN_PROGRESS") {
      attempt.violationCount = (attempt.violationCount || 0) + 1;
      if (attempt.violationCount === 1) {
        attempt.securityStatus = "WARNING";
      } else if (attempt.violationCount > 1) {
        attempt.securityStatus = "VIOLATION";
      }

      const maxAllowed = data.settings.maxViolations ?? 1;
      if (attempt.violationCount >= maxAllowed && data.settings.tabSwitchTerminate) {
        attempt.status = "TERMINATED";
        attempt.securityStatus = "TERMINATED";
        attempt.terminationReason = `Security Violation: ${eventType} (${details || 'Assessment window violation'})`;
        attempt.submittedAt = new Date().toISOString();
      }
    }

    this.writeAll(data);
    return { event, attempt };
  }

  // --- Submission & Server-Side Scoring ---
  submitAssessment(attemptId) {
    const data = this.readAll();
    const attempt = data.quizAttempts.find(a => a.id === attemptId);
    if (!attempt) {
      throw new Error("Attempt record not found.");
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "TERMINATED") {
      return { attempt, answers: data.answers.filter(a => a.attemptId === attemptId) };
    }

    const now = new Date();
    const deadlineMs = new Date(attempt.deadline).getTime();
    const isExpired = now.getTime() > deadlineMs + 5000;

    const studentAnswers = data.answers.filter(a => a.attemptId === attemptId);
    const questionsMap = new Map((data.questions || QUESTION_BANK).map(q => [q.id, q]));

    // Check that every question in attempt.questionOrder is answered
    const assignedQuestionIds = attempt.questionOrder || [];
    for (const qid of assignedQuestionIds) {
      const studentAnsRecord = studentAnswers.find(a => a.questionId === qid);
      if (!isExpired && (!studentAnsRecord || !studentAnsRecord.studentAnswer.trim())) {
        throw new Error("ASSESSMENT INCOMPLETE: Please answer all questions before submitting.");
      }
    }

    let totalScore = 0;
    let maxScore = 0;

    for (const qid of assignedQuestionIds) {
      const q = questionsMap.get(qid);
      if (!q) continue;

      const marks = q.marks || 1;
      maxScore += marks;

      const studentAnsRecord = studentAnswers.find(a => a.questionId === q.id);
      const rawAns = studentAnsRecord ? studentAnsRecord.studentAnswer.trim() : "";

      let isCorrect = false;
      let awarded = 0;

      if (q.questionType === "MCQ") {
        if (rawAns && rawAns === q.correctAnswer) {
          isCorrect = true;
          awarded = marks;
        }
      } else if (q.questionType === "FILL_BLANK") {
        const normalizedStudent = rawAns.toLowerCase().replace(/['"`]/g, '').trim();
        const matches = (q.acceptedAnswers || []).some(acc => {
          const normAcc = acc.toLowerCase().replace(/['"`]/g, '').trim();
          return normAcc === normalizedStudent;
        });
        if (matches) {
          isCorrect = true;
          awarded = marks;
        }
      } else if (q.questionType === "SCENARIO") {
        const lowerAns = rawAns.toLowerCase();
        const keywords = q.expectedKeywords || [];
        if (keywords.length > 0) {
          const found = keywords.filter(kw => lowerAns.includes(kw.toLowerCase()));
          if (found.length >= 2 || (found.length / keywords.length) >= 0.25) {
            isCorrect = true;
            awarded = marks;
          } else if (found.length === 1 && rawAns.length > 25) {
            isCorrect = false;
            awarded = marks * 0.5;
          }
        } else if (rawAns.length > 30) {
          isCorrect = true;
          awarded = marks;
        }
      }

      totalScore += awarded;
      if (studentAnsRecord) {
        studentAnsRecord.isCorrect = isCorrect;
        studentAnsRecord.marksAwarded = awarded;
      }
    }

    attempt.score = Math.round(totalScore * 10) / 10;
    attempt.maxScore = maxScore;
    attempt.percentage = maxScore > 0 ? Math.round((attempt.score / maxScore) * 100) : 0;
    attempt.submittedAt = now.toISOString();
    attempt.status = isExpired ? "TIME_EXPIRED" : "SUBMITTED";

    this.writeAll(data);
    return { attempt, answers: studentAnswers };
  }

  // --- Reset Attempt (Instructor Action) ---
  resetStudentAttempt(rollNumberOrId) {
    const data = this.readAll();
    const clean = (rollNumberOrId || '').trim().toUpperCase();
    const attempt = data.quizAttempts.find(
      a => a.id === rollNumberOrId || a.rollNumber.toUpperCase() === clean || a.studentId === rollNumberOrId
    );

    if (attempt) {
      data.answers = data.answers.filter(ans => ans.attemptId !== attempt.id);
      data.securityEvents = data.securityEvents.filter(ev => ev.attemptId !== attempt.id);
      data.quizAttempts = data.quizAttempts.filter(a => a.id !== attempt.id);
      this.writeAll(data);
      return true;
    }
    return false;
  }

  // --- Instructor Scoreboard & Attendance Overview ---
  getAdminScoreboard() {
    const data = this.readAll();
    const attempts = data.quizAttempts || [];
    const attendance = data.attendance || [];
    const security = data.securityEvents || [];

    const now = Date.now();
    // Auto-finalize any timed-out attempts
    for (const att of attempts) {
      if (att.status === "IN_PROGRESS") {
        const deadlineMs = new Date(att.deadline).getTime();
        if (now > deadlineMs + 5000) {
          try {
            this.submitAssessment(att.id);
          } catch (e) {
            att.status = "TIME_EXPIRED";
          }
        }
      }
    }

    // Build unified rows from attendance records + any attempts
    const processedRolls = new Set();
    const rows = [];

    // First process all attendance records
    for (const attRec of attendance) {
      const roll = attRec.rollNumber.toUpperCase();
      processedRolls.add(roll);

      const attempt = attempts.find(a => a.rollNumber.toUpperCase() === roll);
      const studentSecEvents = security.filter(e => e.rollNumber.toUpperCase() === roll);

      let durationDisplay = "--:--";
      if (attempt) {
        const start = new Date(attempt.startedAt).getTime();
        const end = attempt.submittedAt
          ? new Date(attempt.submittedAt).getTime()
          : Math.min(now, new Date(attempt.deadline).getTime());
        const totalSec = Math.max(0, Math.floor((end - start) / 1000));
        const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');
        durationDisplay = `${mm}:${ss}`;
      }

      rows.push({
        rollNumber: attRec.rollNumber,
        name: attempt ? attempt.studentName : attRec.studentName,
        officialName: attRec.studentName,
        isPresent: !!attRec.isPresent,
        attemptId: attempt ? attempt.id : null,
        status: attempt ? attempt.status : (attRec.isPresent ? "NOT_STARTED" : "LOCKED_ABSENT"),
        score: attempt ? attempt.score : 0,
        maxScore: attempt ? attempt.maxScore : (data.settings.totalQuestions || 10),
        percentage: attempt ? attempt.percentage : 0,
        duration: durationDisplay,
        topicsCount: attempt ? (attempt.selectedTopics?.length || 0) : 0,
        selectedTopics: attempt ? (attempt.selectedTopics || []) : [],
        securityStatus: attempt ? attempt.securityStatus : "CLEAN",
        violationCount: attempt ? (attempt.violationCount || 0) : studentSecEvents.length,
        submittedAt: attempt ? attempt.submittedAt : null,
        terminationReason: attempt ? attempt.terminationReason : null
      });
    }

    // Include any attempts that might not be on the attendance sheet
    for (const att of attempts) {
      const roll = att.rollNumber.toUpperCase();
      if (!processedRolls.has(roll)) {
        processedRolls.add(roll);
        const studentSecEvents = security.filter(e => e.rollNumber.toUpperCase() === roll);

        const start = new Date(att.startedAt).getTime();
        const end = att.submittedAt
          ? new Date(att.submittedAt).getTime()
          : Math.min(now, new Date(att.deadline).getTime());
        const totalSec = Math.max(0, Math.floor((end - start) / 1000));
        const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');

        rows.push({
          rollNumber: att.rollNumber,
          name: att.studentName,
          officialName: att.studentName,
          isPresent: true,
          attemptId: att.id,
          status: att.status,
          score: att.score,
          maxScore: att.maxScore,
          percentage: att.percentage,
          duration: `${mm}:${ss}`,
          topicsCount: att.selectedTopics?.length || 0,
          selectedTopics: att.selectedTopics || [],
          securityStatus: att.securityStatus,
          violationCount: att.violationCount || 0,
          submittedAt: att.submittedAt,
          terminationReason: att.terminationReason
        });
      }
    }

    // Sort: Submitted/highest score first, then in-progress, then not started, then absent
    const rankedRows = [...rows].sort((a, b) => {
      if (a.status === "SUBMITTED" && b.status !== "SUBMITTED") return -1;
      if (a.status !== "SUBMITTED" && b.status === "SUBMITTED") return 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.rollNumber.localeCompare(b.rollNumber);
    }).map((r, i) => ({
      ...r,
      rank: (r.status === "SUBMITTED" || r.status === "TIME_EXPIRED") ? String(i + 1).padStart(2, '0') : "-"
    }));

    // Metrics
    const totalClass = attendance.length;
    const presentCount = attendance.filter(a => a.isPresent).length;
    const absentCount = totalClass - presentCount;
    const completedCount = attempts.filter(a => a.status === "SUBMITTED" || a.status === "TIME_EXPIRED").length;
    const inProgressCount = attempts.filter(a => a.status === "IN_PROGRESS").length;
    const terminatedCount = attempts.filter(a => a.status === "TERMINATED").length;

    const completedAttempts = attempts.filter(a => a.status === "SUBMITTED" || a.status === "TIME_EXPIRED");
    const avgScore = completedAttempts.length > 0
      ? (completedAttempts.reduce((acc, a) => acc + a.score, 0) / completedAttempts.length).toFixed(1)
      : "0.0";

    return {
      metrics: {
        totalClass,
        present: presentCount,
        absent: absentCount,
        quizEligible: presentCount,
        completed: completedCount,
        inProgress: inProgressCount,
        terminated: terminatedCount,
        averageScore: avgScore
      },
      scoreboard: rankedRows,
      recentSecurityEvents: security.slice(0, 20),
      settings: data.settings
    };
  }

  // --- Student Detail Audit for Instructor ---
  getStudentDetail(rollNumberOrAttemptId) {
    const data = this.readAll();
    const clean = (rollNumberOrAttemptId || '').trim().toUpperCase();

    const attempt = data.quizAttempts.find(
      a => a.id === rollNumberOrAttemptId || a.rollNumber.toUpperCase() === clean
    );

    const attRec = (data.attendance || []).find(
      a => a.rollNumber.toUpperCase() === (attempt ? attempt.rollNumber.toUpperCase() : clean)
    );

    if (!attempt && !attRec) {
      return null;
    }

    const answers = attempt ? data.answers.filter(a => a.attemptId === attempt.id) : [];
    const secEvents = data.securityEvents.filter(
      e => e.rollNumber.toUpperCase() === (attempt ? attempt.rollNumber.toUpperCase() : clean)
    );

    const questionsMap = new Map((data.questions || QUESTION_BANK).map(q => [q.id, q]));
    const assignedOrder = attempt ? (attempt.questionOrder || []) : [];

    const questionBreakdown = assignedOrder.map((qid, idx) => {
      const q = questionsMap.get(qid);
      const studentAns = answers.find(a => a.questionId === qid);
      if (!q) return null;

      let formattedCorrect = q.correctAnswer;
      if (q.questionType === "MCQ" && q.options) {
        const correctOpt = q.options.find(o => o.id === q.correctAnswer);
        formattedCorrect = correctOpt ? correctOpt.text : q.correctAnswer;
      } else if (q.acceptedAnswers) {
        formattedCorrect = q.acceptedAnswers.join(' / ');
      } else if (q.expectedKeywords) {
        formattedCorrect = q.expectedKeywords.join(', ');
      }

      return {
        id: q.id,
        orderNum: idx + 1,
        topic: q.topic,
        questionType: q.questionType,
        questionText: q.questionText,
        marks: q.marks || 1,
        studentAnswer: studentAns ? studentAns.studentAnswer : "(Unanswered)",
        isCorrect: studentAns ? !!studentAns.isCorrect : false,
        marksAwarded: studentAns ? (studentAns.marksAwarded || 0) : 0,
        correctAnswer: formattedCorrect,
        explanation: q.explanation || ""
      };
    }).filter(Boolean);

    return {
      rollNumber: attempt ? attempt.rollNumber : attRec.rollNumber,
      studentName: attempt ? attempt.studentName : attRec.studentName,
      officialName: attRec ? attRec.studentName : (attempt ? attempt.studentName : ""),
      isPresent: attRec ? !!attRec.isPresent : true,
      attempt,
      selectedTopics: attempt ? (attempt.selectedTopics || []) : [],
      questionBreakdown,
      securityEvents: secEvents
    };
  }

  // --- Settings & Admin Auth ---
  getSettings() {
    return this.readAll().settings;
  }

  updateSettings(newSettings) {
    const data = this.readAll();
    data.settings = { ...data.settings, ...newSettings };
    this.writeAll(data);
    return data.settings;
  }

  // --- Faculty Whitelist & University Domain ---
  getUniversityDomain() {
    const email = getAuthorizedInstructorEmail();
    const parts = email.split('@');
    return parts.length > 1 ? parts[1] : "uettaxila.edu.pk";
  }

  validateUniversityDomain(email) {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    const domain = this.getUniversityDomain().toLowerCase();
    return clean.endsWith(`@${domain}`) || clean.endsWith(`.${domain}`);
  }

  // --- Audit Event Logger ---
  logAuthEvent(eventType, { email, instructorName, details, severity = 'INFO' }) {
    const data = this.readAll();
    const event = {
      id: `auth-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
      attemptId: "faculty-auth",
      rollNumber: "FACULTY",
      studentName: instructorName || email || "Instructor",
      email: email || null,
      eventType,
      details: details || "",
      severity,
      timestamp: new Date().toISOString()
    };
    if (!data.securityEvents) data.securityEvents = [];
    data.securityEvents.unshift(event);
    this.writeAll(data);
    return event;
  }

  // --- Step 1: Request Temporary Password ---
  async createTemporaryPassword(nameOrEmail, emailParam, clientIp = '127.0.0.1') {
    const data = this.readAll();
    if (!data.authRateLimits) data.authRateLimits = { failedAttempts: {}, requestCooldown: {} };
    if (!data.instructorTemporaryPasswords) data.instructorTemporaryPasswords = [];

    const rawEmail = (emailParam || nameOrEmail || '').toString().trim();
    if (!rawEmail) {
      throw new Error("University email is required.");
    }

    const cleanEmail = rawEmail.toLowerCase();
    const authorizedEmail = getAuthorizedInstructorEmail();

    // 1. Validate Single Authorized Instructor (generic error without leaking allowed email)
    if (cleanEmail !== authorizedEmail) {
      this.logAuthEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        email: cleanEmail,
        instructorName: "Unauthorized Candidate",
        details: `Access denied: ${cleanEmail} is not authorized.`,
        severity: 'WARNING'
      });
      this.writeAll(data);
      throw new Error("Access denied. This email is not authorized.");
    }

    // 2. Check if account is locked
    const failedRecord = data.authRateLimits.failedAttempts?.[cleanEmail];
    const now = Date.now();
    if (failedRecord && failedRecord.lockedUntil) {
      const lockUntilMs = new Date(failedRecord.lockedUntil).getTime();
      if (now < lockUntilMs) {
        const remainingMin = Math.ceil((lockUntilMs - now) / 60000);
        throw new Error(`Account locked due to failed attempts. Try again in ${remainingMin} minute(s).`);
      }
    }

    // 3. Rate limiting: 60s resend cooldown + max 3 per 5 minutes
    const cooldownRecords = data.authRateLimits.requestCooldown || {};
    const emailHistory = (cooldownRecords[cleanEmail] || []).filter(ts => now - ts < 5 * 60 * 1000);

    if (emailHistory.length > 0) {
      const lastTs = emailHistory[emailHistory.length - 1];
      const elapsedMs = now - lastTs;
      if (elapsedMs < 60 * 1000) {
        const remainingSec = Math.ceil((60000 - elapsedMs) / 1000);
        throw new Error(`Please wait ${remainingSec} second(s) before requesting another temporary password.`);
      }
    }

    if (emailHistory.length >= 3) {
      throw new Error("Maximum 3 temporary password requests per 5 minutes reached. Please check your existing email or wait.");
    }

    emailHistory.push(now);
    cooldownRecords[cleanEmail] = emailHistory;
    data.authRateLimits.requestCooldown = cooldownRecords;

    // 5. Generate cryptographically secure random temporary password (format XXXX-XXXX)
    const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randBytes = crypto.randomBytes(8);
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) part1 += charset[randBytes[i] % charset.length];
    for (let i = 4; i < 8; i++) part2 += charset[randBytes[i] % charset.length];
    const temporaryPassword = `${part1}-${part2}`;

    // 6. Store salted SHA-256 hash only (never plaintext)
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.createHash('sha256').update(salt + ':' + temporaryPassword).digest('hex');

    // Invalidate existing unused passwords for this email
    for (const p of data.instructorTemporaryPasswords) {
      if (p.email.toLowerCase() === cleanEmail && !p.used) {
        p.used = true;
        p.invalidatedReason = 'SUPERSEDED_BY_NEW_REQUEST';
      }
    }

    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutes
    data.instructorTemporaryPasswords.push({
      id: `tp-${crypto.randomBytes(6).toString('hex')}`,
      instructorId: "inst-001",
      instructorName: "Dr. Naveed Khan",
      email: cleanEmail,
      salt,
      passwordHash,
      createdAt: new Date(now).toISOString(),
      expiresAt,
      used: false
    });

    // 7. Log audit event
    this.logAuthEvent('INSTRUCTOR_PASSWORD_REQUESTED', {
      email: cleanEmail,
      instructorName: "Dr. Naveed Khan",
      details: `Temporary password generated for ${cleanEmail}. Dispatched to institutional inbox.`,
      severity: 'INFO'
    });

    this.writeAll(data);

    // 8. Dispatch to Institutional Email via nodemailer / outbox fallback
    await sendInstructorLoginEmail({
      toEmail: cleanEmail,
      instructorName: "Dr. Naveed Khan",
      temporaryPassword
    });

    // NEVER leak password to client
    return {
      success: true,
      email: cleanEmail,
      message: `Temporary password generated and sent to ${cleanEmail}. Valid for 10 minutes.`,
      cooldownSeconds: 60,
      expiresInSeconds: 600
    };
  }

  // --- Step 2: Verify Temporary Password & Create Session ---
  verifyTemporaryPassword(email, candidatePassword, clientIp = '127.0.0.1') {
    const data = this.readAll();
    if (!data.authRateLimits) data.authRateLimits = { failedAttempts: {}, requestCooldown: {} };
    if (!data.instructorTemporaryPasswords) data.instructorTemporaryPasswords = [];
    if (!data.instructorSessions) data.instructorSessions = [];

    if (!email || !candidatePassword) {
      throw new Error("Both university email and temporary password are required.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = candidatePassword.trim().toUpperCase();
    const authorizedEmail = getAuthorizedInstructorEmail();
    const now = Date.now();

    // 1. Validate Single Authorized Instructor (generic error)
    if (cleanEmail !== authorizedEmail) {
      throw new Error("Access denied. This email is not authorized.");
    }

    // 2. Check Lockout Status (5 failed attempts = 15 minutes lockout)
    const failedRecords = data.authRateLimits.failedAttempts || {};
    const emailFail = failedRecords[cleanEmail] || { count: 0, lockedUntil: null };

    if (emailFail.lockedUntil) {
      const lockUntilMs = new Date(emailFail.lockedUntil).getTime();
      if (now < lockUntilMs) {
        const remainingMin = Math.ceil((lockUntilMs - now) / 60000);
        throw new Error(`Account locked due to 5 consecutive failed attempts. Try again in ${remainingMin} minute(s).`);
      } else {
        // Lockout expired
        emailFail.count = 0;
        emailFail.lockedUntil = null;
      }
    }

    // 3. Find latest active temporary password for this instructor
    const activePassRecords = data.instructorTemporaryPasswords.filter(
      p => p.email.toLowerCase() === cleanEmail && !p.used
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (activePassRecords.length === 0) {
      emailFail.count = (emailFail.count || 0) + 1;
      const remaining = Math.max(0, 5 - emailFail.count);
      if (emailFail.count >= 5) {
        emailFail.lockedUntil = new Date(now + 15 * 60 * 1000).toISOString();
        this.logAuthEvent('INSTRUCTOR_ACCOUNT_LOCKED', {
          email: cleanEmail,
          instructorName: "Dr. Naveed Khan",
          details: `Account locked for 15 minutes after 5 consecutive failed login attempts.`,
          severity: 'CRITICAL'
        });
      } else {
        this.logAuthEvent('INSTRUCTOR_LOGIN_FAILED', {
          email: cleanEmail,
          instructorName: "Dr. Naveed Khan",
          details: `No active temporary password found. Remaining attempts: ${remaining}.`,
          severity: 'WARNING'
        });
      }
      failedRecords[cleanEmail] = emailFail;
      data.authRateLimits.failedAttempts = failedRecords;
      this.writeAll(data);
      throw new Error(`No active temporary password found. Please request a new code. Remaining attempts: ${remaining}`);
    }

    const latestPass = activePassRecords[0];

    // 4. Check expiration (10 minutes)
    if (now > new Date(latestPass.expiresAt).getTime()) {
      latestPass.used = true;
      latestPass.invalidatedReason = 'EXPIRED';
      this.logAuthEvent('INSTRUCTOR_LOGIN_FAILED', {
        email: cleanEmail,
        instructorName: "Dr. Naveed Khan",
        details: 'Attempted to use expired temporary password.',
        severity: 'WARNING'
      });
      this.writeAll(data);
      throw new Error("Temporary password has expired (10-minute limit exceeded). Please request a new code.");
    }

    // 5. Verify cryptographic hash
    const candidateHash = crypto.createHash('sha256').update(latestPass.salt + ':' + cleanPass).digest('hex');
    const bufCandidate = Buffer.from(candidateHash, 'hex');
    const bufStored = Buffer.from(latestPass.passwordHash, 'hex');
    const isMatch = bufCandidate.length === bufStored.length && crypto.timingSafeEqual(bufCandidate, bufStored);

    if (!isMatch) {
      emailFail.count = (emailFail.count || 0) + 1;
      const remaining = Math.max(0, 5 - emailFail.count);

      if (emailFail.count >= 5) {
        emailFail.lockedUntil = new Date(now + 15 * 60 * 1000).toISOString();
        failedRecords[cleanEmail] = emailFail;
        data.authRateLimits.failedAttempts = failedRecords;
        this.logAuthEvent('INSTRUCTOR_ACCOUNT_LOCKED', {
          email: cleanEmail,
          instructorName: "Dr. Naveed Khan",
          details: `Account locked for 15 minutes after 5 failed password attempts.`,
          severity: 'CRITICAL'
        });
        this.writeAll(data);
        throw new Error("Account locked due to 5 consecutive failed attempts. Your account has been locked for 15 minutes.");
      } else {
        failedRecords[cleanEmail] = emailFail;
        data.authRateLimits.failedAttempts = failedRecords;
        this.logAuthEvent('INSTRUCTOR_LOGIN_FAILED', {
          email: cleanEmail,
          instructorName: "Dr. Naveed Khan",
          details: `Invalid temporary password entered. ${remaining} attempt(s) remaining.`,
          severity: 'WARNING'
        });
        this.writeAll(data);
        throw new Error(`Invalid temporary password. ${remaining} attempt(s) remaining before account lockout.`);
      }
    }

    // 6. Success: mark temporary password as used (single-use enforcement)
    latestPass.used = true;
    latestPass.usedAt = new Date(now).toISOString();

    // Reset failed counter
    failedRecords[cleanEmail] = { count: 0, lockedUntil: null };
    data.authRateLimits.failedAttempts = failedRecords;

    // 7. Create server-side session (8 hours)
    const sessionToken = `inst_sess_${crypto.randomBytes(32).toString('hex')}`;
    const session = {
      token: sessionToken,
      instructorId: "inst-001",
      email: cleanEmail,
      name: "Dr. Naveed Khan",
      role: "Lead Java Examiner",
      department: "Department of Computer Science & Software Engineering",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 8 * 3600 * 1000).toISOString(),
      ipAddress: clientIp
    };

    data.instructorSessions.push(session);

    this.logAuthEvent('INSTRUCTOR_LOGIN_SUCCESS', {
      email: cleanEmail,
      instructorName: "Dr. Naveed Khan",
      details: `Successful authenticated login for Dr. Naveed Khan. Session established.`,
      severity: 'INFO'
    });

    this.writeAll(data);

    return {
      success: true,
      token: sessionToken,
      instructor: {
        id: "inst-001",
        name: "Dr. Naveed Khan",
        email: cleanEmail,
        role: "Lead Java Examiner",
        department: "Department of Computer Science & Software Engineering"
      }
    };
  }

  // --- Session Validation & Invalidation ---
  validateSessionToken(token) {
    if (!token) return null;
    const data = this.readAll();
    const session = (data.instructorSessions || []).find(s => s.token === token);
    if (!session) return null;

    const now = Date.now();
    if (now > new Date(session.expiresAt).getTime()) {
      data.instructorSessions = data.instructorSessions.filter(s => s.token !== token);
      this.writeAll(data);
      return null;
    }

    return session;
  }

  invalidateSession(token) {
    if (!token) return false;
    const data = this.readAll();
    const session = (data.instructorSessions || []).find(s => s.token === token);
    if (session) {
      data.instructorSessions = data.instructorSessions.filter(s => s.token !== token);
      this.logAuthEvent('INSTRUCTOR_LOGOUT', {
        email: session.email,
        instructorName: session.name,
        details: `Instructor ${session.name} signed out cleanly.`
      });
      this.writeAll(data);
      return true;
    }
    return false;
  }
}

export const db = new QuizDatabase();
