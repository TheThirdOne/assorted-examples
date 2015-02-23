package main

import (
	"fmt"
)

type Board struct {
	player int8
	board  [7][]int8
}

func (self *Board) drop(index int8) *Board {
	if len(self.board[index]) > 5 {
		return nil
	}
	copy := *self
	copy.board[index] = append(copy.board[index], copy.player)
	copy.player = -copy.player
	return &copy
}

func (self *Board) hash() int64 {
	var out, tmp int64
	for _, col := range self.board {
		out = out << 3
		out += int64(len(col))
	}
	for _, col := range self.board {
		for _, cell := range col {
			tmp = tmp << 1
			if cell == 1 {
				tmp++
			}
		}
	}
	out = out<<42 + tmp
	out *= int64(self.player)
	return out
}

func (self *Board) win() int8 {
	var tmp int8

	//vertical
	for _, col := range self.board {
		tmp = 0
		for _, temp := range col {
			if tmp*temp > 0 {
				tmp += temp
			} else {
				tmp = temp
			}
			if tmp > 3 {
				return 1
			} else if tmp < -3 {

				return -1
			}
		}
	}

	for i := 0; i < 6; i++ {
		tmp = 0
		for k := 0; k < 6; k++ {
			if len(self.board[k]) <= i {
				tmp = 0
			} else if tmp*self.board[k][i] >= 0 {
				tmp += self.board[k][i]
			} else {
				tmp = self.board[k][i]
			}
			if tmp > 3 {
				return 1
			} else if tmp < -3 {
				return -1
			}
		}
	}
	//top left to bottom right
	starting := [6][2]int8{{0, 3}, {0, 4}, {0, 5}, {1, 5}, {2, 5}, {3, 5}}
	var index [2]int8
	for i := 0; i < 6; i++ {
		index = starting[i]
		tmp = 0
		for k := 0; k < 6; k++ {

			if len(self.board[index[0]]) <= int(index[1]) {
				tmp = 0
			} else if tmp*self.board[index[0]][index[1]] >= 0 {
				tmp += self.board[index[0]][index[1]]
			} else {
				tmp = self.board[index[0]][index[1]]
			}
			if tmp > 3 {
				return 1
			} else if tmp < -3 {
				return -1
			}
			index[0]++
			index[1]--
			if index[0] > 6 || index[1] < 0 {
				break
			}
		}
	}
	starting = [6][2]int8{{6, 3}, {6, 4}, {6, 5}, {5, 5}, {4, 5}, {2, 5}}
	for i := 0; i < 6; i++ {
		index = starting[i]
		tmp = 0
		for k := 0; k < 6; k++ {

			if len(self.board[index[0]]) <= int(index[1]) {
				tmp = 0
			} else if tmp*self.board[index[0]][index[1]] >= 0 {
				tmp += self.board[index[0]][index[1]]
			} else {
				tmp = self.board[index[0]][index[1]]
			}
			if tmp > 3 {
				return 1
			} else if tmp < -3 {
				return -1
			}
			index[0]--
			index[1]--
			if index[0] < 0 || index[1] < 0 {
				break
			}
		}
	}
	tmp = 0
	for i := 0; i < 7; i++ {
		tmp += int8(len(self.board[i]))
	}
	if tmp > 41 {
		return 0
	}
	return -2
}
var boards map[int64]int8
var canTie bool
func (self *Board) evaluate() int8{
	if value, exists := boards[self.hash()]; exists{
		return value
	}
	if winner := self.win(); winner != -2{
		return winner
	}
	for i := 0; i < 7; i++{
		tmp := self.drop(int8(i))
		if tmp == nil {
			continue
		}
		score := tmp.evaluate()
		if score == self.player{
			boards[self.hash()] = self.player
			return self.player	
		}
		if score == 0{
			canTie = true
		}
	}
	if canTie{
		boards[self.hash()] = 0
		return 0
	}
	boards[self.hash()] = -self.player;
	return -self.player;
}
func main() {
	boards = make(map[int64]int8)
	y := new(Board)
	y.player = 1
	fmt.Print(y.evaluate())
}
