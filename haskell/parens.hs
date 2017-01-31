data TopEntry = P Paren | E Entry deriving (Show)
data Entry = Tree Int [Entry] Int deriving (Show)
type Paren = (Bool, Int)

insertParen :: Entry -> Paren -> (Maybe Paren, [Entry], Maybe Paren)
insertParen (Tree a mid b) paren@(dir, c)
  | b < c       = (Nothing, [Tree a mid b], Just paren)
  | c < a       = (Just paren, [Tree a mid b], Nothing)
  | otherwise   = combine (partition mid paren) paren a b

combine :: ([Entry], Maybe Entry, [Entry]) -> Paren -> Int -> Int -> (Maybe Paren, [Entry], Maybe Paren)
combine (xs, Nothing, ys) (True,c) a b  = (Nothing, (Tree a xs c):ys, Just (True, b))
combine (xs, Nothing, ys) (False,c) a b = (Just (False,a), xs++[Tree c ys b], Nothing)
combine (xs, (Just e@(Tree _ _ r)), ys) (True,c) a b = (Nothing,(Tree a (xs++list) r):ys,Just (True, b))
  where (_, list, _) = insertParen e (True,c)
combine (xs, (Just e@(Tree l _ _)), ys) (False,c) a b = (Just (False,a), xs++[Tree l (list++ys) b], Nothing)
  where (_, list, _) = insertParen e (False,c)

partition :: [Entry] -> Paren -> ([Entry], Maybe Entry, [Entry])
partition (tree@(Tree a m b):xs) paren@(_, c)
  | c < a     = ([],Nothing,tree:xs)
  | b < c     = (tree:front,mid,back)
  | otherwise = ([],Just tree,xs)
  where (front, mid, back) = partition xs paren

insertParenTop :: [TopEntry] -> Paren -> [TopEntry]
insertParenTop [] p = [P p]
insertParenTop xs paren = linearProbe $ combineTop (partitionTop xs paren) paren
  
linearProbe :: ([TopEntry],Paren,[TopEntry]) -> [TopEntry]
linearProbe (xs,paren@(True,c),ys) =  if (null back) || dir == True
                                      then xs ++ (P paren):ys
                                      else (reverse (tail back)) ++ (E (Tree i (map trimEntry $ reverse front) c)):ys
  where front = takeWhile isEntry $ reverse xs
        back  = dropWhile isEntry $ reverse xs
        P (dir,i) = head back
linearProbe (xs,paren@(False,c),ys) =  if (null back) || dir == False
                                then xs ++ (P paren):ys
                                else xs ++ (E (Tree c (map trimEntry front) i)):ys
  where front = takeWhile isEntry ys
        back  = dropWhile isEntry ys
        P (dir,i) = head back

isEntry :: TopEntry -> Bool
isEntry (E _) = True
isEntry _     = False

trimEntry :: TopEntry -> Entry
trimEntry (E e) = e
trimEntry _     = error "Can't trim a non Tree"

combineTop :: ([TopEntry], Maybe Entry, [TopEntry]) -> Paren -> ([TopEntry],Paren,[TopEntry])
combineTop (xs, Nothing, ys) paren = (xs,paren,ys)
combineTop (xs, (Just e@(Tree _ _ r)), ys) (True,c)  = (xs++(map E list), (True,r), ys)
  where (_, list, _) = insertParen e (True,c)
combineTop (xs, (Just e@(Tree l _ _)), ys) (False,c) = (xs, (False, l), (map E list)++ys)
  where (_, list, _) = insertParen e (False,c)


partitionTop :: [TopEntry] -> Paren -> ([TopEntry], Maybe Entry, [TopEntry])
partitionTop [] _ = ([], Nothing, [])
partitionTop ((E tree@(Tree a m b)):xs) paren@(_, c)
  | c < a     = ([],Nothing,(E tree):xs)
  | b < c     = ((E tree):front,mid,back)
  | otherwise = ([],Just tree,xs)
  where (front, mid, back) = partitionTop xs paren
partitionTop ((P par@(_,a)):xs) paren@(_, b)
  | b < a     = ([],Nothing,(P par):xs)
  | a < b     = ((P par):front,mid,back)
  | otherwise = error "Parens can't be inside eachother"
    where (front, mid, back) = partitionTop xs paren

partMap :: ([Entry], Maybe Entry, [Entry]) -> ([TopEntry], Maybe Entry, [TopEntry])
partMap (front, mid, back) = (map E front, mid, map E back)

fromString = fromString' [] 0

fromString' :: [TopEntry] -> Int -> [Char] -> [TopEntry]
fromString' list i (x:xs) = fromString' (insertParenTop list (toParen x i)) (i+1) xs
fromString' list _ []     = list

toParen :: Char -> Int -> Paren
toParen '(' i = (False,i)
toParen ')' i = (True,i)
toParen  _  _ = error "Not a paren"
