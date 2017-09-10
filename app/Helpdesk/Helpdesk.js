/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.on('display-end-user')
    .then('Zendesk:find-user').merge('user', '$:0')
    .Match('$:user.id')
    .  WhenType('Number')
    .    then('Zendesk:display-end-user', '$:user.id')
    .  Otherwise()
    .    then('Zendesk:create-end-user', '$:@')
    .  end()
    .end()

};
