-- Seed data for VR Meta University courses
-- Run this in your PostgreSQL database

-- Clear existing data (optional)
-- TRUNCATE TABLE "Courses" RESTART IDENTITY CASCADE;

INSERT INTO "Courses" ("Title", "ShortDescription", "Description", "ImageUrl", "DurationMinutes", "Difficulty", "IsPublished", "CreatedAt")
VALUES
-- Programming & Tech
(
  'Machine Learning Fundamentals',
  'Master the core concepts of ML, from supervised learning to neural networks',
  'Comprehensive introduction to machine learning covering regression, classification, clustering, and deep learning fundamentals. Build real projects with Python and TensorFlow.',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
  420,
  'Intermediate',
  true,
  NOW()
),
(
  'Web Development Bootcamp',
  'Build modern web applications from scratch with React and Node.js',
  'Full-stack development course covering HTML, CSS, JavaScript, React, Node.js, and databases. Create portfolio-ready projects.',
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
  600,
  'Beginner',
  true,
  NOW()
),
(
  'Data Science with Python',
  'Analyze data, create visualizations, and build predictive models',
  'Learn pandas, NumPy, matplotlib, and scikit-learn. Work with real datasets and create compelling data stories.',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  480,
  'Intermediate',
  true,
  NOW()
),
(
  'Cybersecurity Essentials',
  'Learn to protect systems and networks from cyber threats',
  'Understand network security, ethical hacking, cryptography, and security best practices. Hands-on labs included.',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
  360,
  'Advanced',
  true,
  NOW()
),

-- Design & Creative
(
  'UI/UX Design Masterclass',
  'Create beautiful, user-centered digital experiences',
  'Master Figma, design systems, user research, and prototyping. Build a professional design portfolio.',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  300,
  'Beginner',
  true,
  NOW()
),
(
  '3D Modeling for VR',
  'Create immersive 3D environments and assets for virtual reality',
  'Learn Blender, texturing, lighting, and optimization for VR platforms. Export ready-to-use assets.',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
  540,
  'Intermediate',
  true,
  NOW()
),

-- Business & Management
(
  'Digital Marketing Strategy',
  'Build and execute data-driven marketing campaigns',
  'SEO, social media marketing, content strategy, and analytics. Real campaign projects with measurable results.',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  240,
  'Beginner',
  true,
  NOW()
),
(
  'Project Management Professional',
  'Lead projects successfully with agile and traditional methodologies',
  'Scrum, Kanban, waterfall, risk management, and stakeholder communication. Prepare for PMP certification.',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  320,
  'Intermediate',
  true,
  NOW()
),

-- Science & Math
(
  'Quantum Computing Basics',
  'Understand the principles behind the next computing revolution',
  'Qubits, superposition, entanglement, and quantum algorithms explained with visual simulations.',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
  280,
  'Advanced',
  true,
  NOW()
),
(
  'Statistics for Data Analysis',
  'Build a solid foundation in statistical thinking and methods',
  'Probability, hypothesis testing, regression analysis, and Bayesian statistics with practical applications.',
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80',
  360,
  'Intermediate',
  true,
  NOW()
);

-- Verify inserted data
SELECT "Id", "Title", "Difficulty", "DurationMinutes" FROM "Courses" ORDER BY "Id";
