import { ApolloError } from 'apollo-server-express';
import dotenv from 'dotenv';
import { Op } from 'sequelize'; // Import Sequelize operators

import logger from "../../Config/logger.mjs";
import { Blog, Match, League, AttachmentBlog } from '../../Models/index.mjs';

dotenv.config();

export const resolvers = {
  Query: {
    Home: async (parent, args, context, info) => {
      try {
        // Get today's date in "YYYY-MM-DD" format
        const today = new Date().toISOString().split('T')[0];
        console.log(today);

        // Fetch today's matches by matching only the date part
        const matches = await Match.findAll({
          where: {
            date: {
              [Op.like]: `${today}%`  // Matches any date starting with today's date
            }
          }
        });

        console.log("matches:",matches)
        // Fetch the last 10 blogs with attachment_blog included
        const blogs = await Blog.findAll({
          limit: 21,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: AttachmentBlog,
              as: 'attachment_blog', // Adjust the alias if necessary based on your model associations
            }
          ]
        });

        // Fetch the latest leagues
        const leagues = await League.findAll({
          order: [['createdAt', 'DESC']],
          limit: 6,
        });

        return {
          Match: matches,
          Blog: blogs,
          League: leagues,
        };
      } catch (error) {
        logger.error('Error fetching Home data: ', error);
        throw new ApolloError("Failed to fetch data for Home", "HOME_DATA_FETCH_FAILED", { error });
      }
    },
  },
};
