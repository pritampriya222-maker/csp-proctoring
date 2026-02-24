-- DEMO EXAM GENERATION SCRIPT
-- RUN THIS IN THE SUPABASE SQL EDITOR

DO $$ 
DECLARE 
    admin_id UUID;
    ml_exam_id UUID;
    web_exam_id UUID;
BEGIN
    -- 1. Get an admin user
    SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found in profiles table. Please register an admin first.';
    END IF;

    -- 2. Create Machine Learning Exam
    INSERT INTO public.exams (title, description, start_time, end_time, duration_minutes, created_by)
    VALUES (
        'Machine Learning Fundamentals', 
        'Demo Exam: Covers Neural Networks, Regression, and Classification. This exam is available permanently for demo purposes.', 
        '2024-01-01 00:00:00+00', 
        '2099-12-31 23:59:59+00', 
        120, 
        admin_id
    ) RETURNING id INTO ml_exam_id;

    -- 3. Create Web Technologies Exam
    INSERT INTO public.exams (title, description, start_time, end_time, duration_minutes, created_by)
    VALUES (
        'Modern Web Technologies', 
        'Demo Exam: Covers React, Next.js, and Backend API design. This exam is available permanently for demo purposes.', 
        '2024-01-01 00:00:00+00', 
        '2099-12-31 23:59:59+00', 
        90, 
        admin_id
    ) RETURNING id INTO web_exam_id;

    -- 4. Insert ML Questions
    INSERT INTO public.exam_questions (exam_id, type, question_text, options, correct_answer)
    VALUES 
    (ml_exam_id, 'mcq', 'What is the primary goal of Supervised Learning?', '["Minimize cost function", "Find hidden patterns in unlabeled data", "Predict outcomes based on labeled training data", "Reinforce positive behaviors"]', 'Predict outcomes based on labeled training data'),
    (ml_exam_id, 'mcq', 'Which algorithm is typically used for Binary Classification?', '["Linear Regression", "K-Means Clustering", "Logistic Regression", "Principal Component Analysis"]', 'Logistic Regression'),
    (ml_exam_id, 'mcq', 'What does the term "Overfitting" refer to in ML?', '["The model is too simple for the data", "The model performs excellently on training data but poorly on test data", "The model takes too long to train", "The model uses too many features"]', 'The model performs excellently on training data but poorly on test data'),
    (ml_exam_id, 'mcq', 'Which activation function is most common in the hidden layers of a Deep Neural Network?', '["Sigmoid", "ReLU (Rectified Linear Unit)", "Softmax", "Tanh"]', 'ReLU (Rectified Linear Unit)'),
    (ml_exam_id, 'subjective', 'Explain the Bias-Variance tradeoff in Machine Learning.', NULL, NULL);

    -- 5. Insert Web Questions
    INSERT INTO public.exam_questions (exam_id, type, question_text, options, correct_answer)
    VALUES 
    (web_exam_id, 'mcq', 'What does SSR stand for in the context of Next.js?', '["Static Site Rendering", "Server Side Rendering", "Simple Socket Response", "System State Recovery"]', 'Server Side Rendering'),
    (web_exam_id, 'mcq', 'Which React Hook is used to handle side effects in a functional component?', '["useState", "useMemo", "useEffect", "useCallback"]', 'useEffect'),
    (web_exam_id, 'mcq', 'What is the purpose of the "key" prop in a React list?', '["To uniquely identify and optimize DOM reconciliation", "To style the element", "To store metadata about the item", "To map the array index"]', 'To uniquely identify and optimize DOM reconciliation'),
    (web_exam_id, 'mcq', 'In RESTful API design, which HTTP method is typically used to update an existing resource?', '["POST", "GET", "PUT/PATCH", "DELETE"]', 'PUT/PATCH'),
    (web_exam_id, 'subjective', 'Describe the benefits of using a Virtual DOM compared to direct DOM manipulation.', NULL, NULL);

    RAISE NOTICE 'Demo exams created successfully. ML Exam ID: %, Web Exam ID: %', ml_exam_id, web_exam_id;
END $$;
