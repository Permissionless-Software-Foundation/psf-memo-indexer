import { handleSetName } from './set-name.js'
import { handlePost } from './post.js'
import { handleReply } from './reply.js'
import { handleLike } from './like.js'
import { handleSetProfile } from './set-profile.js'
import { handleFollow } from './follow.js'
import { handleSetProfilePic } from './set-profile-pic.js'
import { handleTopicMessage } from './topic-message.js'
import { handleTopicFollow } from './topic-follow.js'

export const ACTION_HANDLERS = {
  setName: handleSetName,
  post: handlePost,
  reply: handleReply,
  like: handleLike,
  setProfile: handleSetProfile,
  follow: handleFollow,
  unfollow: handleFollow,
  setProfilePic: handleSetProfilePic,
  topicMessage: handleTopicMessage,
  topicFollow: handleTopicFollow,
  topicUnfollow: handleTopicFollow
}

export async function dispatchMemoAction (ctx) {
  const handler = ACTION_HANDLERS[ctx.decoded.action]
  if (!handler) {
    console.log(`No handler for action ${ctx.decoded.action}`)
    return false
  }
  await handler(ctx)
  return true
}
