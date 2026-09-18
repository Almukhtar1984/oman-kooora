import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        blog(id: ID): Blog #@auth(requires: user)
        allBlogs: [Blog!] #@auth(requires: user)
        allBlogsClub(idClub: ID): [Blog!] @auth(requires: user)
        allBlogsTeam(idTeam: ID): [Blog!] @auth(requires: user)
    }

    extend type Mutation {
        createBlog(content: contentBlog!): Blog! @auth(requires: user)

        updateBlog (id: ID!, content: contentBlog!): statusUpdate @auth(requires: user)

        deleteBlog ( id: ID! ): statusDelete @auth(requires: user)

        # Bump the news article's view counter (mobile app, on open).
        incrementBlogViews ( id: ID! ): statusUpdate
    }

    type Blog {
        id:                 ID
        subject:            String
        short_description:  String
        description:        String
        attachment:         [AttachmentBlog]
        status:             String

        # Mobile app fields.
        category:           String   # news | competitions | players | clubs
        category_label:     String   # أخبار | مسابقات | لاعبين | أندية
        author_name:        String
        views_count:        Int
        time_ago:           String   # منذ 3 ساعات / منذ يومين

        club:               Club
        team:               Team

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type AttachmentBlog {
        id:               ID
        content:          String

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentBlog {
        subject:            String
        short_description:  String
        description:        String
        attachment:         [Upload]
        status:             String

        category:           String
        author_name:        String

        id_club:            ID
        id_team:            ID
    }

`;
