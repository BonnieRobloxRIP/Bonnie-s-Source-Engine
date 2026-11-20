# // brr: test a room without playing the whole mode.
# Spawns the room 2 blocks below you, puts you at its entrance and starts it immediately.
# Room name = room_name in lowercase with _ for spaces. End the test with: /scriptevent brr:rooms stop test
tp @s 80 150 -20
tag @s add hard
tag @s add tester
tag @s add hard_music
tag @s remove lobby
scoreboard players reset @s music
scriptevent brr:rooms test hard r3 tesla_power
