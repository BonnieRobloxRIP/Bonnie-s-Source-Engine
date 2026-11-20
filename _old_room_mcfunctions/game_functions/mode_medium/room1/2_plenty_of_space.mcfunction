# = LOADING =
# // Level
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run structure load "medium/room1/2_plenty_of_space:MediumRoom1V2" ~-7 ~1 ~-14
# // Next Room Anchor
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run summon brr:flood_room ^3 ^18 ^-14 0 0 * medium_room1_anchor
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run scoreboard players add R1B1 medium 0
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run scoreboard players add R1B2 medium 0
# // essential
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run scoreboard players add r1_end medium 0
# // = End =
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run scoreboard players set loaded1 medium 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room1:MediumRoom1" ~-7 ~1 ~-14
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room1/2_plenty_of_space:MediumRoom1V2" ~-7 ~1 ~-14
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R1B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R1B2 endless 0
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^ ^2 ^
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1