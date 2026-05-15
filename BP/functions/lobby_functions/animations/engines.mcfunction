# = HANDLES BOTH ENGINES AT ONCE =
# - SCORES -
scoreboard players add engine lobby 1
scoreboard players add enginesound lobby 1
execute if score enginesound lobby matches 42.. run scoreboard players set enginesound lobby 0
execute if score engine lobby matches 19.. run scoreboard players set engine lobby 0
# - ANIMATIONS -
# // Pistons
# // Right 1
execute if score engine lobby matches 1 run structure load "lobby/animated:EnginePiston1" -10 23 21
execute if score engine lobby matches 2 run structure load "lobby/animated:EnginePiston2" -10 23 21
execute if score engine lobby matches 4 run structure load "lobby/animated:EnginePiston3" -10 23 21
execute if score engine lobby matches 5 run structure load "lobby/animated:EnginePiston4" -10 23 21
execute if score engine lobby matches 7 run structure load "lobby/animated:EnginePiston5" -10 23 21
execute if score engine lobby matches 8 run structure load "lobby/animated:EnginePiston6" -10 23 21
execute if score engine lobby matches 10 run structure load "lobby/animated:EnginePiston7" -10 23 21
execute if score engine lobby matches 11 run structure load "lobby/animated:EnginePiston6" -10 23 21 180_degrees
execute if score engine lobby matches 13 run structure load "lobby/animated:EnginePiston5" -10 23 21 180_degrees
execute if score engine lobby matches 14 run structure load "lobby/animated:EnginePiston4" -10 23 21 180_degrees
execute if score engine lobby matches 16 run structure load "lobby/animated:EnginePiston3" -10 23 21 180_degrees
execute if score engine lobby matches 18 run structure load "lobby/animated:EnginePiston2" -10 23 21 180_degrees
# // Right 2
execute if score engine lobby matches 1 run structure load "lobby/animated:EnginePiston3" -10 23 10
execute if score engine lobby matches 2 run structure load "lobby/animated:EnginePiston4" -10 23 10
execute if score engine lobby matches 4 run structure load "lobby/animated:EnginePiston5" -10 23 10
execute if score engine lobby matches 5 run structure load "lobby/animated:EnginePiston6" -10 23 10
execute if score engine lobby matches 7 run structure load "lobby/animated:EnginePiston7" -10 23 10
execute if score engine lobby matches 8 run structure load "lobby/animated:EnginePiston6" -10 23 10 180_degrees
execute if score engine lobby matches 10 run structure load "lobby/animated:EnginePiston5" -10 23 10 180_degrees
execute if score engine lobby matches 11 run structure load "lobby/animated:EnginePiston4" -10 23 10 180_degrees
execute if score engine lobby matches 13 run structure load "lobby/animated:EnginePiston3" -10 23 10 180_degrees
execute if score engine lobby matches 14 run structure load "lobby/animated:EnginePiston2" -10 23 10 180_degrees
execute if score engine lobby matches 16 run structure load "lobby/animated:EnginePiston1" -10 23 10
execute if score engine lobby matches 18 run structure load "lobby/animated:EnginePiston2" -10 23 10
# // Right 3
execute if score engine lobby matches 1 run structure load "lobby/animated:EnginePiston5" -10 23 -4
execute if score engine lobby matches 2 run structure load "lobby/animated:EnginePiston6" -10 23 -4
execute if score engine lobby matches 4 run structure load "lobby/animated:EnginePiston7" -10 23 -4
execute if score engine lobby matches 5 run structure load "lobby/animated:EnginePiston6" -10 23 -4 180_degrees
execute if score engine lobby matches 7 run structure load "lobby/animated:EnginePiston5" -10 23 -4 180_degrees
execute if score engine lobby matches 8 run structure load "lobby/animated:EnginePiston4" -10 23 -4 180_degrees
execute if score engine lobby matches 10 run structure load "lobby/animated:EnginePiston3" -10 23 -4 180_degrees
execute if score engine lobby matches 11 run structure load "lobby/animated:EnginePiston2" -10 23 -4 180_degrees
execute if score engine lobby matches 13 run structure load "lobby/animated:EnginePiston1" -10 23 -4
execute if score engine lobby matches 14 run structure load "lobby/animated:EnginePiston2" -10 23 -4
execute if score engine lobby matches 16 run structure load "lobby/animated:EnginePiston3" -10 23 -4
execute if score engine lobby matches 18 run structure load "lobby/animated:EnginePiston4" -10 23 -4
# // Right 4
execute if score engine lobby matches 1 run structure load "lobby/animated:EnginePiston7" -10 23 -15 180_degrees
execute if score engine lobby matches 2 run structure load "lobby/animated:EnginePiston6" -10 23 -15 180_degrees
execute if score engine lobby matches 4 run structure load "lobby/animated:EnginePiston5" -10 23 -15 180_degrees
execute if score engine lobby matches 5 run structure load "lobby/animated:EnginePiston4" -10 23 -15 180_degrees
execute if score engine lobby matches 7 run structure load "lobby/animated:EnginePiston3" -10 23 -15 180_degrees
execute if score engine lobby matches 8 run structure load "lobby/animated:EnginePiston2" -10 23 -15 180_degrees
execute if score engine lobby matches 10 run structure load "lobby/animated:EnginePiston1" -10 23 -15
execute if score engine lobby matches 11 run structure load "lobby/animated:EnginePiston2" -10 23 -15
execute if score engine lobby matches 13 run structure load "lobby/animated:EnginePiston3" -10 23 -15
execute if score engine lobby matches 14 run structure load "lobby/animated:EnginePiston4" -10 23 -15
execute if score engine lobby matches 16 run structure load "lobby/animated:EnginePiston5" -10 23 -15
execute if score engine lobby matches 18 run structure load "lobby/animated:EnginePiston6" -10 23 -15
# // Left 1
execute if score engine lobby matches 1 run structure load "lobby/animated:EnginePiston1" 6 23 21 180_degrees
execute if score engine lobby matches 2 run structure load "lobby/animated:EnginePiston2" 6 23 21 180_degrees
execute if score engine lobby matches 4 run structure load "lobby/animated:EnginePiston3" 6 23 21 180_degrees
execute if score engine lobby matches 5 run structure load "lobby/animated:EnginePiston4" 6 23 21 180_degrees
execute if score engine lobby matches 7 run structure load "lobby/animated:EnginePiston5" 6 23 21 180_degrees
execute if score engine lobby matches 8 run structure load "lobby/animated:EnginePiston6" 6 23 21 180_degrees
execute if score engine lobby matches 10 run structure load "lobby/animated:EnginePiston7" 6 23 21
execute if score engine lobby matches 11 run structure load "lobby/animated:EnginePiston6" 6 23 21
execute if score engine lobby matches 13 run structure load "lobby/animated:EnginePiston5" 6 23 21
execute if score engine lobby matches 14 run structure load "lobby/animated:EnginePiston4" 6 23 21
execute if score engine lobby matches 16 run structure load "lobby/animated:EnginePiston3" 6 23 21
execute if score engine lobby matches 18 run structure load "lobby/animated:EnginePiston2" 6 23 21
# // Left 2
execute if score engine lobby matches 1 run structure load "lobby/animated:EnginePiston3" 6 23 10 180_degrees
execute if score engine lobby matches 2 run structure load "lobby/animated:EnginePiston4" 6 23 10 180_degrees
execute if score engine lobby matches 4 run structure load "lobby/animated:EnginePiston5" 6 23 10 180_degrees
execute if score engine lobby matches 5 run structure load "lobby/animated:EnginePiston6" 6 23 10 180_degrees
execute if score engine lobby matches 7 run structure load "lobby/animated:EnginePiston7" 6 23 10 180_degrees
execute if score engine lobby matches 8 run structure load "lobby/animated:EnginePiston6" 6 23 10
execute if score engine lobby matches 10 run structure load "lobby/animated:EnginePiston5" 6 23 10
execute if score engine lobby matches 11 run structure load "lobby/animated:EnginePiston4" 6 23 10
execute if score engine lobby matches 13 run structure load "lobby/animated:EnginePiston3" 6 23 10
execute if score engine lobby matches 14 run structure load "lobby/animated:EnginePiston2" 6 23 10
execute if score engine lobby matches 16 run structure load "lobby/animated:EnginePiston1" 6 23 10 180_degrees
execute if score engine lobby matches 18 run structure load "lobby/animated:EnginePiston2" 6 23 10 180_degrees
# // Left 3
execute if score engine lobby matches 1 run structure load "lobby/animated:EnginePiston5" 6 23 -4 180_degrees
execute if score engine lobby matches 2 run structure load "lobby/animated:EnginePiston6" 6 23 -4 180_degrees
execute if score engine lobby matches 4 run structure load "lobby/animated:EnginePiston7" 6 23 -4 180_degrees
execute if score engine lobby matches 5 run structure load "lobby/animated:EnginePiston6" 6 23 -4
execute if score engine lobby matches 7 run structure load "lobby/animated:EnginePiston5" 6 23 -4
execute if score engine lobby matches 8 run structure load "lobby/animated:EnginePiston4" 6 23 -4
execute if score engine lobby matches 10 run structure load "lobby/animated:EnginePiston3" 6 23 -4
execute if score engine lobby matches 11 run structure load "lobby/animated:EnginePiston2" 6 23 -4
execute if score engine lobby matches 13 run structure load "lobby/animated:EnginePiston1" 6 23 -4 180_degrees
execute if score engine lobby matches 14 run structure load "lobby/animated:EnginePiston2" 6 23 -4 180_degrees
execute if score engine lobby matches 16 run structure load "lobby/animated:EnginePiston3" 6 23 -4 180_degrees
execute if score engine lobby matches 18 run structure load "lobby/animated:EnginePiston4" 6 23 -4 180_degrees
# // left 4
execute if score engine lobby matches 1 run structure load "lobby/animated:EnginePiston7" 6 23 -15
execute if score engine lobby matches 2 run structure load "lobby/animated:EnginePiston6" 6 23 -15
execute if score engine lobby matches 4 run structure load "lobby/animated:EnginePiston5" 6 23 -15
execute if score engine lobby matches 5 run structure load "lobby/animated:EnginePiston4" 6 23 -15
execute if score engine lobby matches 7 run structure load "lobby/animated:EnginePiston3" 6 23 -15
execute if score engine lobby matches 8 run structure load "lobby/animated:EnginePiston2" 6 23 -15
execute if score engine lobby matches 10 run structure load "lobby/animated:EnginePiston1" 6 23 -15 180_degrees
execute if score engine lobby matches 11 run structure load "lobby/animated:EnginePiston2" 6 23 -15 180_degrees
execute if score engine lobby matches 13 run structure load "lobby/animated:EnginePiston3" 6 23 -15 180_degrees
execute if score engine lobby matches 14 run structure load "lobby/animated:EnginePiston4" 6 23 -15 180_degrees
execute if score engine lobby matches 16 run structure load "lobby/animated:EnginePiston5" 6 23 -15 180_degrees
execute if score engine lobby matches 18 run structure load "lobby/animated:EnginePiston6" 6 23 -15 180_degrees
# // Gears

# // Particles

# // Sounds
execute if score enginesound lobby matches 1 run playsound sfx.engine.1 @a -8 25 22
execute if score enginesound lobby matches 1 run playsound sfx.engine.2 @a -8 25 -3
execute if score enginesound lobby matches 1 run playsound sfx.engine.3 @a 8 25 22
execute if score enginesound lobby matches 1 run playsound sfx.engine.4 @a 8 25 -3

