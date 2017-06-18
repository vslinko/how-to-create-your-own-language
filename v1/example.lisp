(def increment
  (fn (a)
    (return (add a 1))
  )
)

(print increment)
(print (increment 1))
