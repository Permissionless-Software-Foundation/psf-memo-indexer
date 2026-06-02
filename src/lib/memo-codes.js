/*
  Memo protocol action codes (mirrors Go ref/bitcoin/memo/codes.go).
*/

export const CODE_PREFIX = 0x6d

export const CODE_SET_NAME = 0x01
export const CODE_POST = 0x02
export const CODE_REPLY = 0x03
export const CODE_LIKE = 0x04
export const CODE_SET_PROFILE = 0x05
export const CODE_FOLLOW = 0x06
export const CODE_UNFOLLOW = 0x07
export const CODE_SET_PROFILE_PIC = 0x0a
export const CODE_TOPIC_MESSAGE = 0x0c
export const CODE_TOPIC_FOLLOW = 0x0d
export const CODE_TOPIC_UNFOLLOW = 0x0e

export const PREFIX_SET_NAME = Buffer.from([CODE_PREFIX, CODE_SET_NAME])
export const PREFIX_POST = Buffer.from([CODE_PREFIX, CODE_POST])
export const PREFIX_REPLY = Buffer.from([CODE_PREFIX, CODE_REPLY])
export const PREFIX_LIKE = Buffer.from([CODE_PREFIX, CODE_LIKE])
export const PREFIX_SET_PROFILE = Buffer.from([CODE_PREFIX, CODE_SET_PROFILE])
export const PREFIX_FOLLOW = Buffer.from([CODE_PREFIX, CODE_FOLLOW])
export const PREFIX_UNFOLLOW = Buffer.from([CODE_PREFIX, CODE_UNFOLLOW])
export const PREFIX_SET_PROFILE_PIC = Buffer.from([CODE_PREFIX, CODE_SET_PROFILE_PIC])
export const PREFIX_TOPIC_MESSAGE = Buffer.from([CODE_PREFIX, CODE_TOPIC_MESSAGE])
export const PREFIX_TOPIC_FOLLOW = Buffer.from([CODE_PREFIX, CODE_TOPIC_FOLLOW])
export const PREFIX_TOPIC_UNFOLLOW = Buffer.from([CODE_PREFIX, CODE_TOPIC_UNFOLLOW])

export const MAX_POST_SIZE = 65000
export const MAX_REPLY_SIZE = 65000
export const TX_HASH_LENGTH = 32
export const PK_HASH_LENGTH = 20

export const ACTION_NAMES = {
  [`${CODE_PREFIX}-${CODE_SET_NAME}`]: 'setName',
  [`${CODE_PREFIX}-${CODE_POST}`]: 'post',
  [`${CODE_PREFIX}-${CODE_REPLY}`]: 'reply',
  [`${CODE_PREFIX}-${CODE_LIKE}`]: 'like',
  [`${CODE_PREFIX}-${CODE_SET_PROFILE}`]: 'setProfile',
  [`${CODE_PREFIX}-${CODE_FOLLOW}`]: 'follow',
  [`${CODE_PREFIX}-${CODE_UNFOLLOW}`]: 'unfollow',
  [`${CODE_PREFIX}-${CODE_SET_PROFILE_PIC}`]: 'setProfilePic',
  [`${CODE_PREFIX}-${CODE_TOPIC_MESSAGE}`]: 'topicMessage',
  [`${CODE_PREFIX}-${CODE_TOPIC_FOLLOW}`]: 'topicFollow',
  [`${CODE_PREFIX}-${CODE_TOPIC_UNFOLLOW}`]: 'topicUnfollow'
}

export function isMemoPrefix (buf) {
  return buf && buf.length >= 2 && buf[0] === CODE_PREFIX
}

export function getActionFromPrefix (prefixBuf) {
  if (!isMemoPrefix(prefixBuf)) return null
  return ACTION_NAMES[`${prefixBuf[0]}-${prefixBuf[1]}`] || null
}
