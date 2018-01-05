/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.on('display-end-user')
    .then('Zendesk.Session:find-first-user', { identity: '$:identity' }).merge({ user: '$:user' })
    .then(function (e) { console.log('after find', e); return e; })
    .Unless('$:user.id')
    .  then( 'Zendesk.Session:create-user'
           , { name: 'Ziwo autocreated end-user'
             , phone: '$:identity'
             , role: 'end-user'
             }
           ).merge()
    .  end()
    .  then(function (e) { console.log('before show', e); return e; })
    .then('Zendesk.Session:show-user', '$:user.id').dismiss()
    .end()

};
