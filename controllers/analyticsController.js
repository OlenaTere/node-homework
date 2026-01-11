const prisma = require("../db/prisma");

const userAnalytics = async (req, res, next) => {
    const userId = parseInt(req.params.id);
  
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
  
    try {
      // 404 check required: user MUST exist
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // groupBy: count tasks by completion status
      const taskStats = await prisma.task.groupBy({
        by: ["isCompleted"],
        where: { userId },
        _count: { id: true },
      });
  
      // recent tasks (last 10) with eager loading (User.name)
      const recentTasks = await prisma.task.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          priority: true,
          createdAt: true,
          userId: true,
          User: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
  
      // weekly progress: tasks created in last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
      const weeklyProgress = await prisma.task.groupBy({
        by: ["createdAt"],
        where: {
          userId,
          createdAt: { gte: oneWeekAgo },
        },
        _count: { id: true },
      });
  
      return res.status(200).json({
        taskStats,
        recentTasks,
        weeklyProgress,
      });
    } catch (err) {
      return next(err);
    }
  };

  const usersWithTaskCounts = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (page < 1) {
        return res.status(400).json({ message: "page must be >= 1" });
      }
      
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ message: "limit must be between 1 and 100" });
      }
    const skip = (page - 1) * limit;
  
    try {
      const usersRaw = await prisma.user.findMany({
        include: {
          Task: {
            where: { isCompleted: false },
            select: { id: true },
            take: 5,
          },
          _count: {
            select: { Task: true },
          },
        },
        skip: skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
  
      const users = usersRaw.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        _count: user._count,
        Task: user.Task,
      }));
  
      const total = await prisma.user.count();
      const pages = Math.ceil(total / limit);
  
      const pagination = {
        page,
        limit,
        total,
        pages,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };
  
      return res.status(200).json({ users, pagination });
    } catch (err) {
      return next(err);
    }
  };

  const taskSearch = async (req, res, next) => {
    const searchQuery = (req.query.q || "").trim();
  
    if (searchQuery.length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters long",
      });
    }
  
    const limit = parseInt(req.query.limit) || 20;
    if (limit < 1 || limit > 100) {
        return res.status(400).json({ message: "limit must be between 1 and 100" });
      }
  
    // Build patterns outside the SQL for safe parameterization
    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;
  
    try {
      const results = await prisma.$queryRaw`
        SELECT 
          t.id,
          t.title,
          t.is_completed as "isCompleted",
          t.priority,
          t.created_at as "createdAt",
          t.user_id as "userId",
          u.name as "user_name"
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        WHERE t.title ILIKE ${searchPattern}
           OR u.name ILIKE ${searchPattern}
        ORDER BY 
          CASE 
            WHEN t.title ILIKE ${exactMatch} THEN 1
            WHEN t.title ILIKE ${startsWith} THEN 2
            WHEN t.title ILIKE ${searchPattern} THEN 3
            ELSE 4
          END,
          t.created_at DESC
        LIMIT ${limit}
      `;
  
      return res.status(200).json({
        results,
        query: searchQuery,
        count: results.length,
      });
    } catch (err) {
      return next(err);
    }
  };
  
  module.exports = {
    getUserAnalytics: userAnalytics,
    getUsersWithStats: usersWithTaskCounts,
    searchTasks: taskSearch,
    userAnalytics,
    usersWithTaskCounts,
    taskSearch,
  };