# = LOADING =
# // Level
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score loaded1 hard matches 0 run structure load "hard/room1/1_trapped:HardRoom1V1" ~-14 ~1 ~-7
# // Next Room Anchor
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score loaded1 hard matches 0 run summon brr:flood_room ^-14 ^18 ^3 0 0 * hard_room1_anchor
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score loaded1 hard matches 0 run scoreboard players add R1B1 hard 0
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score loaded1 hard matches 0 run scoreboard players add R1B2 hard 0
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score loaded1 hard matches 0 run scoreboard players add R1B3 hard 0
# // essential
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score loaded1 hard matches 0 run scoreboard players add r1_end hard 0
# // = End =
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score loaded1 hard matches 0 run scoreboard players set loaded1 hard 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "hard/room1:HardRoom1" ~-14 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "hard/room1/1_trapped:HardRoom1V1" ~-14 ~1 ~-7
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R1B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R1B2 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R1B3 endless 0
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^ ^2 ^
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1