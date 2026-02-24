-- Massive Question Dataset (100 Questions)
-- Divided into Machine Learning and Web Technologies
-- Categorized by Easy, Medium, Hard

-- Get Exam IDs (Assuming they exist from previous demo setup)
DO $$
DECLARE
    ml_id UUID;
    web_id UUID;
BEGIN
    SELECT id INTO ml_id FROM public.exams WHERE title ILIKE '%Machine Learning%' LIMIT 1;
    SELECT id INTO web_id FROM public.exams WHERE title ILIKE '%Web Technologies%' LIMIT 1;

    -- Clear existing questions for these exams to avoid duplicates during demo setup
    DELETE FROM public.exam_questions WHERE exam_id IN (ml_id, web_id);

    ---------------------------------------------------------------------------
    -- MACHINE LEARNING FUNDAMENTALS (50 Questions)
    ---------------------------------------------------------------------------

    -- EASY (17 Questions)
    INSERT INTO public.exam_questions (exam_id, question_text, options, correct_answer, difficulty, type) VALUES
    (ml_id, 'What does "Supervised Learning" mean?', '["Learning with labeled data", "Learning without labels", "Learning with rewards", "Learning by clustering"]', 'Learning with labeled data', 'easy', 'mcq'),
    (ml_id, 'Which of these is a classification algorithm?', '["Linear Regression", "K-Means", "Logistic Regression", "Principal Component Analysis"]', 'Logistic Regression', 'easy', 'mcq'),
    (ml_id, 'What is the "Target" in a dataset?', '["The input features", "The independent variable", "The dependent variable/label", "The bias term"]', 'The dependent variable/label', 'easy', 'mcq'),
    (ml_id, 'In ML, what does "Overfitting" imply?', '["The model is too simple", "The model fits noise in training data", "The model generalizes well", "The model has high bias"]', 'The model fits noise in training data', 'easy', 'mcq'),
    (ml_id, 'What is the full form of CNN in deep learning?', '["Computer Neural Network", "Convolutional Neural Network", "Complex Neural Node", "Central Neural Network"]', 'Convolutional Neural Network', 'easy', 'mcq'),
    (ml_id, 'What is "Regression" used for?', '["Predicting categories", "Predicting continuous values", "Clustering data", "Reducing dimensionality"]', 'Predicting continuous values', 'easy', 'mcq'),
    (ml_id, 'Which library is most common for data manipulation in Python?', '["TensorFlow", "PyTorch", "Pandas", "Matplotlib"]', 'Pandas', 'easy', 'mcq'),
    (ml_id, 'What is a "Feature" in a dataset?', '["The output label", "An individual measurable property", "The model accuracy", "The loss function"]', 'An individual measurable property', 'easy', 'mcq'),
    (ml_id, 'What is the purpose of a Training set?', '["To test the final model", "To tune hyperparameters", "To teach the model patterns", "To evaluate bias"]', 'To teach the model patterns', 'easy', 'mcq'),
    (ml_id, 'Which of these is an Unsupervised Learning task?', '["Spam detection", "House price prediction", "Customer segmentation", "Image classification"]', 'Customer segmentation', 'easy', 'mcq'),
    (ml_id, 'What is "Bias" in Machine Learning?', '["Random noise", "Error from erroneous assumptions", "The variance of the model", "The learning rate"]', 'Error from erroneous assumptions', 'easy', 'mcq'),
    (ml_id, 'What is a "Neuron" in an ANN?', '["A computer chip", "A mathematical function", "A database record", "A physical sensor"]', 'A mathematical function', 'easy', 'mcq'),
    (ml_id, 'Which activation function is most common in hidden layers?', '["Softmax", "Sigmoid", "ReLU", "Step"]', 'ReLU', 'easy', 'mcq'),
    (ml_id, 'What is "Standardization" in preprocessing?', '["Scaling data to mean 0 and std 1", "Converting text to lowercase", "Removing outliers", "Filling missing values"]', 'Scaling data to mean 0 and std 1', 'easy', 'mcq'),
    (ml_id, 'What does "Loss" represent?', '["Model speed", "Difference between prediction and truth", "Data size", "Learning rate value"]', 'Difference between prediction and truth', 'easy', 'mcq'),
    (ml_id, 'Which algorithm is based on "neighbors"?', '["SVM", "KNN", "Decision Tree", "Naive Bayes"]', 'KNN', 'easy', 'mcq'),
    (ml_id, 'Briefly describe what a "Learning Rate" does in Gradient Descent.', null, null, 'easy', 'subjective'),

    -- MEDIUM (17 Questions)
    (ml_id, 'Explain the difference between L1 and L2 regularization.', null, null, 'medium', 'subjective'),
    (ml_id, 'What is the "Vanishing Gradient" problem?', '["Weights becoming zero", "Gradients becoming too small to update weights", "Error increasing indefinitely", "Loss function having no minimum"]', 'Gradients becoming too small to update weights', 'medium', 'mcq'),
    (ml_id, 'How does a Random Forest differ from a Decision Tree?', '["It uses boosting", "It is an ensemble of multiple trees", "It only handles regression", "It is simpler to interpret"]', 'It is an ensemble of multiple trees', 'medium', 'mcq'),
    (ml_id, 'What is Cross-Validation primarily used for?', '["Speeding up training", "Reducing memory usage", "Estimating model generalization performance", "Cleaning data"]', 'Estimating model generalization performance', 'medium', 'mcq'),
    (ml_id, 'What happens in "Backpropagation"?', '["Data flows forward", "Error is propagated backwards to update weights", "The model stops learning", "Features are removed"]', 'Error is propagated backwards to update weights', 'medium', 'mcq'),
    (ml_id, 'What is the "Curse of Dimensionality"?', '["High memory usage", "Data becoming sparse in high dimensions", "Model becoming too fast", "Removing important features"]', 'Data sparse in high dimensions', 'medium', 'mcq'),
    (ml_id, 'In SVM, what is a "Kernel"?', '["The CPU core", "A function to map data to higher dimensions", "The loss optimizer", "The regularizer"]', 'A function to map data to higher dimensions', 'medium', 'mcq'),
    (ml_id, 'What is the "F1 Score" a harmonic mean of?', '["Bias and Variance", "Precision and Recall", "Accuracy and Loss", "Sensitivity and Specificity"]', 'Precision and Recall', 'medium', 'mcq'),
    (ml_id, 'Explain the "One-Hot Encoding" process.', null, null, 'medium', 'subjective'),
    (ml_id, 'What is "Ensemble Learning"?', '["Using one large model", "Combining multiple models for better results", "Data augmentation", "Preprocessing data"]', 'Combining multiple models for better results', 'medium', 'mcq'),
    (ml_id, 'What is "Pruning" in Decision Trees?', '["Adding more branches", "Removing branches that provide little power", "Choosing the root node", "Splitting the data"]', 'Removing branches that provide little power', 'medium', 'mcq'),
    (ml_id, 'What is the "Sigmoid" range?', '["-1 to 1", "0 to 1", "Negative infinity to infinity", "0 to infinity"]', '0 to 1', 'medium', 'mcq'),
    (ml_id, 'What is "Data Augmentation"?', '["Deleting data", "Creating synthetic variations of data", "Manually labeling data", "Compressing files"]', 'Creating synthetic variations of data', 'medium', 'mcq'),
    (ml_id, 'Describe the "Bias-Variance Tradeoff".', null, null, 'medium', 'subjective'),
    (ml_id, 'What is "Stochastic Gradient Descent" (SGD)?', '["Updating weights after every one example", "Updating weights after the whole batch", "A random loss function", "A pruning technique"]', 'Updating weights after every one example', 'medium', 'mcq'),
    (ml_id, 'What is "Transfer Learning"?', '["Moving data to another PC", "Using a pre-trained model for a new task", "Translating labels", "Transferring bias"]', 'Using a pre-trained model for a new task', 'medium', 'mcq'),
    (ml_id, 'What is "Early Stopping" used for?', '["Preventing overfitting", "Speeding up CPU", "Cleaning data", "Increasing bias"]', 'Preventing overfitting', 'medium', 'mcq'),

    -- HARD (16 Questions)
    (ml_id, 'Explain the mathematical foundation of Adam optimizer.', null, null, 'hard', 'subjective'),
    (ml_id, 'What is "Batch Normalization" and why does it help?', '["Normalizing inputs to each layer", "A data cleaning step", "A way to reduce data size", "A pruning method"]', 'Normalizing inputs to each layer', 'hard', 'mcq'),
    (ml_id, 'What is the difference between "Generative" and "Discriminative" models?', null, null, 'hard', 'subjective'),
    (ml_id, 'What is "Gradient Clipping" used for?', '["Preventing overfitting", "Handling exploding gradients", "Reducing bias", "Feature selection"]', 'Handling exploding gradients', 'hard', 'mcq'),
    (ml_id, 'Describe the architecture of a "Transformer".', null, null, 'hard', 'subjective'),
    (ml_id, 'What is the "Attention Mechanism" in deep learning?', '["Focusing on specific parts of input data", "Increasing learning rate", "A new loss function", "A data augmentation tool"]', 'Focusing on specific parts of input data', 'hard', 'mcq'),
    (ml_id, 'Explain "Principal Component Analysis" (PCA) math.', null, null, 'hard', 'subjective'),
    (ml_id, 'What is "Dropout" in Neural Networks?', '["Removing neurons during training to prevent overfitting", "Removing entire layers", "A type of activation", "A weight initialization method"]', 'Removing neurons during training to prevent overfitting', 'hard', 'mcq'),
    (ml_id, 'What is the "Kernel Trick" in SVM actually doing mathematically?', null, null, 'hard', 'subjective'),
    (ml_id, 'In Reinforcement Learning, what is the "Bellman Equation"?', '["A loss function", "A recurrence relation for value functions", "A data cleaning tool", "A gradient clipper"]', 'A recurrence relation for value functions', 'hard', 'mcq'),
    (ml_id, 'Explain "Autoencoders" and their bottleneck layer.', null, null, 'hard', 'subjective'),
    (ml_id, 'What is "XGBoost" and how does it use second-order derivatives?', null, null, 'hard', 'subjective'),
    (ml_id, 'What is "ROC AUC" and how is it calculated?', '["Area under the precision-recall curve", "Area under the True Positive vs False Positive rate curve", "Mean Absolute Error", "Accuracy per class"]', 'Area under the True Positive vs False Positive rate curve', 'hard', 'mcq'),
    (ml_id, 'What are "Residual Connections" (ResNets)?', '["Skipping layers to allow gradients to flow better", "Connecting to a database", "Removing noise", "A type of pooling"]', 'Skipping layers to allow gradients to flow better', 'hard', 'mcq'),
    (ml_id, 'Explain the concept of "Word Embeddings" (Word2Vec).', null, null, 'hard', 'subjective'),
    (ml_id, 'What is "Contrastive Learning" in SSL?', '["Learning by comparing similar/dissimilar pairs", "A supervised task", "A dimensionality reduction tool", "A type of clustering"]', 'Learning by comparing similar/dissimilar pairs', 'hard', 'mcq');

    ---------------------------------------------------------------------------
    -- MODERN WEB TECHNOLOGIES (50 Questions)
    ---------------------------------------------------------------------------

    -- EASY (17 Questions)
    INSERT INTO public.exam_questions (exam_id, question_text, options, correct_answer, difficulty, type) VALUES
    (web_id, 'What does HTML stand for?', '["Hyperlink Text Markup Language", "Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlink Tool Management Language"]', 'Hyper Text Markup Language', 'easy', 'mcq'),
    (web_id, 'Which tag is used for the largest heading?', '["<heading>", "<h6>", "<h1>", "<head>"]', '<h1>', 'easy', 'mcq'),
    (web_id, 'What is the purpose of CSS?', '["Data storage", "Styling and layout", "Server-side logic", "Database management"]', 'Styling and layout', 'easy', 'mcq'),
    (web_id, 'What is "React"?', '["A database", "A CSS framework", "A JavaScript library for UIs", "A back-end language"]', 'A JavaScript library for UIs', 'easy', 'mcq'),
    (web_id, 'How do you create a link in HTML?', '["<link>", "<a>", "<url>", "<href>"]', '<a>', 'easy', 'mcq'),
    (web_id, 'What is "NPM"?', '["Node Package Manager", "Network Protocol Module", "New Project Model", "Node Process Manager"]', 'Node Package Manager', 'easy', 'mcq'),
    (web_id, 'Which property changes background color in CSS?', '["color", "bgcolor", "background-color", "fill"]', 'background-color', 'easy', 'mcq'),
    (web_id, 'What is a "React Hook"?', '["A way to connect to a DB", "A function that lets you use state/lifecycle", "A CSS selector", "A dev tool"]', 'A function that lets you use state/lifecycle', 'easy', 'mcq'),
    (web_id, 'What is "JSON"?', '["JavaScript Object Notation", "Java System On Network", "JS Object Node", "Joint System Online"]', 'JavaScript Object Notation', 'easy', 'mcq'),
    (web_id, 'Which HTML attribute specifies an inline style?', '["class", "id", "style", "font"]', 'style', 'easy', 'mcq'),
    (web_id, 'What does CSS "Flexbox" do?', '["Connects to APIs", "Aligns items in a container", "Stores data", "Speeds up loading"]', 'Aligns items in a container', 'easy', 'mcq'),
    (web_id, 'Which symbol is used for ID in CSS?', '["#", ".", "&", "*"]', '#', 'easy', 'mcq'),
    (web_id, 'What is "DOMContentLoaded" event?', '["When a user clicks", "When the page finishes loading all assets", "When the initial HTML is parsed", "When the page is closed"]', 'When the initial HTML is parsed', 'easy', 'mcq'),
    (web_id, 'What is "Tailwind CSS"?', '["A JS library", "A utility-first CSS framework", "A browser", "A database"]', 'A utility-first CSS framework', 'easy', 'mcq'),
    (web_id, 'In React, what are "Props"?', '["Internal state", "Arguments passed into components", "CSS properties", "Global variables"]', 'Arguments passed into components', 'easy', 'mcq'),
    (web_id, 'What is the use of `<div>` tag?', '["Making text bold", "Sectioning content", "Inserting images", "Linking pages"]', 'Sectioning content', 'easy', 'mcq'),
    (web_id, 'Briefly explain the role of "Alt" text in images.', null, null, 'easy', 'subjective'),

    -- MEDIUM (17 Questions)
    (web_id, 'Explain the "Virtual DOM" and why it is fast.', null, null, 'medium', 'subjective'),
    (web_id, 'What is the purpose of `useEffect` dependencies?', '["To trigger re-renders", "To control when the effect runs", "To style components", "To store data"]', 'To control when the effect runs', 'medium', 'mcq'),
    (web_id, 'What is "State Lifting" in React?', '["Using Redux", "Moving state to a common parent", "Optimizing renders", "Fetching data"]', 'Moving state to a common parent', 'medium', 'mcq'),
    (web_id, 'What are "Promises" in JavaScript?', '["Variable declarations", "Objects representing eventual completion of async tasks", "CSS animations", "Security tokens"]', 'Objects representing eventual completion of async tasks', 'medium', 'mcq'),
    (web_id, 'What is "CORS"?', '["A type of variable", "Cross-Origin Resource Sharing", "A frontend framework", "A browser extension"]', 'Cross-Origin Resource Sharing', 'medium', 'mcq'),
    (web_id, 'How does "Async/Await" differ from `.then()`?', null, null, 'medium', 'subjective'),
    (web_id, 'What is "Server-Side Rendering" (SSR)?', '["Rendering JS on the server", "Using a server as a DB", "Styling on server", "Client-side routing"]', 'Rendering JS on the server', 'medium', 'mcq'),
    (web_id, 'What is "Next.js"?', '["A CSS library", "A React framework for production", "An IDE", "A SQL server"]', 'A React framework for production', 'medium', 'mcq'),
    (web_id, 'Explain the concept of "Middleware" in Next.js.', null, null, 'medium', 'subjective'),
    (web_id, 'What is "TypeScript"?', '["A text editor", "A typed superset of JavaScript", "A browser engine", "A CSS preprocessor"]', 'A typed superset of JavaScript', 'medium', 'mcq'),
    (web_id, 'What is "LocalStorage" capacity approx?', '["5KB", "5MB", "5GB", "Unlimited"]', '5MB', 'medium', 'mcq'),
    (web_id, 'What are "React Error Boundaries"?', '["CSS bugs", "Components that catch JS errors in their tree", "Security firewalls", "Network timeouts"]', 'Components that catch JS errors in their tree', 'medium', 'mcq'),
    (web_id, 'What is "Prop Drilling" and how to avoid it?', null, null, 'medium', 'subjective'),
    (web_id, 'What is `useState` hook used for?', '["Handling side effects", "Managing local component state", "Routing", "Global state"]', 'Managing local component state', 'medium', 'mcq'),
    (web_id, 'What is "Babel" in web development?', '["A database", "A JavaScript transpiler", "A code linter", "A testing tool"]', 'A JavaScript transpiler', 'medium', 'mcq'),
    (web_id, 'What is "Zustand" or "Redux"?', '["CSS frameworks", "State management libraries", "Image optimizers", "Testing runners"]', 'State management libraries', 'medium', 'mcq'),
    (web_id, 'What does `git push` do?', '["Clone a repo", "Upload local changes to remote", "Delete local files", "Merge branches"]', 'Upload local changes to remote', 'medium', 'mcq'),

    -- HARD (16 Questions)
    (web_id, 'Deep dive: Explain "React Server Components" vs "Client Components".', null, null, 'hard', 'subjective'),
    (web_id, 'What is "Hydration" in the context of SSR?', '["Drinking water during coding", "Attaching event listeners to server-rendered HTML", "Cleaning the cache", "Optimizing images"]', 'Attaching event listeners to server-rendered HTML', 'hard', 'mcq'),
    (web_id, 'Explain "Progressive Web Apps" (PWA) core features.', null, null, 'hard', 'subjective'),
    (web_id, 'What are "Service Workers"?', '["Background scripts for offline/push", "Server administrators", "Cloud functions", "CSS animations"]', 'Background scripts for offline/push', 'hard', 'mcq'),
    (web_id, 'How does "Tree Shaking" work in Webpack/Vite?', '["Removing unused code during build", "Optimizing folder structure", "Scanning for viruses", "Re-using variables"]', 'Removing unused code during build', 'hard', 'mcq'),
    (web_id, 'Explain "Lazy Loading" and `React.lazy`.', null, null, 'hard', 'subjective'),
    (web_id, 'What is "Critical CSS"?', '["CSS that is broken", "CSS required for the above-the-fold content", "A new JS library", "Browser default styles"]', 'CSS required for the above-the-fold content', 'hard', 'mcq'),
    (web_id, 'What is "XSS" (Cross-Site Scripting) and how to prevent it?', null, null, 'hard', 'subjective'),
    (web_id, 'What is "CSRF" (Cross-Site Request Forgery) and its prevention?', null, null, 'hard', 'subjective'),
    (web_id, 'Explain the "Event Loop" in Node.js/JavaScript.', null, null, 'hard', 'subjective'),
    (web_id, 'What is "Edge Computing" in the context of Vercel/Next.js?', '["Running code close to the user", "Using a new browser", "Rendering on a 4K monitor", "Using advanced CSS"]', 'Running code close to the user', 'hard', 'mcq'),
    (web_id, 'Explain "Memoization" in React using `useMemo` and `useCallback`.', null, null, 'hard', 'subjective'),
    (web_id, 'What is "Micro-Frontend" architecture?', '["Using small monitors", "Breaking a large app into independent features", "Using small fonts", "Mobile-only apps"]', 'Breaking a large app into independent features', 'hard', 'mcq'),
    (web_id, 'What is "WebAssembly" (Wasm)?', '["A new CSS standard", "Binary format for near-native performance in web", "A data server", "A cloud provider"]', 'Binary format for near-native performance in web', 'hard', 'mcq'),
    (web_id, 'Explain the difference between OAuth2 and OpenID Connect.', null, null, 'hard', 'subjective'),
    (web_id, 'What is "Content Security Policy" (CSP)?', '["A security header to prevent XSS", "A privacy law", "A CSS library", "A database engine"]', 'A security header to prevent XSS', 'hard', 'mcq');

END $$;
