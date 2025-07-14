"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import {
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  User,
  CreditCard,
  Edit,
  Calculator,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

type AppUser = {
  id: string
  name: string
  isActive: boolean
}

type Transaction = {
  id: number
  type: "収入" | "支出"
  amount: number
  description: string
  date: Date
  userId: string
  isShared: boolean
  isAdvancedPayment: boolean
  advancedForUserId?: string
}

const UserManagement = ({ users, setUsers }) => {
  const [newUserName, setNewUserName] = useState("")

  const addUser = () => {
    if (newUserName.trim()) {
      setUsers([...users, { id: Date.now().toString(), name: newUserName.trim(), isActive: false }])
      setNewUserName("")
    }
  }

  const deleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId))
  }

  const setActiveUser = (userId: string) => {
    setUsers(users.map((user) => ({ ...user, isActive: user.id === userId })))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ユーザー管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="新しいユーザー名" />
          <Button onClick={addUser}>追加</Button>
        </div>
        <ScrollArea className="h-[200px]">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center py-2 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
              onClick={() => setActiveUser(user.id)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  {user.isActive && <Check className="h-4 w-4 text-green-600" />}
                </div>
                <span className={user.isActive ? "font-medium text-green-600" : ""}>
                  {user.name}
                  {user.isActive && <span className="ml-2 text-xs">(利用中)</span>}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteUser(user.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </ScrollArea>
        <div className="mt-4 text-sm text-gray-600">※ クリックしたユーザーが新規取引のデフォルトユーザーになります</div>
      </CardContent>
    </Card>
  )
}

const TransactionForm = ({
  users,
  addTransaction,
  updateTransaction,
  selectedTransaction,
  clearSelectedTransaction,
}) => {
  const [transactionType, setTransactionType] = useState<"収入" | "支出">("支出")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [paymentType, setPaymentType] = useState<"normal" | "shared" | "advanced">("normal")
  const [advancedForUserId, setAdvancedForUserId] = useState("")

  // アクティブユーザーまたは最初のユーザーをデフォルトに設定
  useEffect(() => {
    if (users.length > 0 && !selectedTransaction) {
      const activeUser = users.find((user) => user.isActive)
      const defaultUser = activeUser || users[0]
      setSelectedUser(defaultUser.id)
    }
  }, [users, selectedTransaction])

  // 選択された取引が変更されたときにフォームを更新
  useEffect(() => {
    if (selectedTransaction) {
      setTransactionType(selectedTransaction.type)
      setAmount(selectedTransaction.amount.toString())
      setDescription(selectedTransaction.description)
      setSelectedUser(selectedTransaction.userId)
      setSelectedDate(selectedTransaction.date)

      if (selectedTransaction.isShared) {
        setPaymentType("shared")
      } else if (selectedTransaction.isAdvancedPayment) {
        setPaymentType("advanced")
      } else {
        setPaymentType("normal")
      }

      setAdvancedForUserId(selectedTransaction.advancedForUserId || "")
    }
  }, [selectedTransaction])

  // ユーザー変更時の立替対象調整
  useEffect(() => {
    if (paymentType === "advanced") {
      const otherUsers = users.filter((user) => user.id !== selectedUser)
      if (otherUsers.length > 0 && !otherUsers.find((user) => user.id === advancedForUserId)) {
        setAdvancedForUserId(otherUsers[0].id)
      } else if (otherUsers.length === 0) {
        setAdvancedForUserId("")
      }
    }
  }, [selectedUser, paymentType, users, advancedForUserId])

  const resetForm = () => {
    setAmount("")
    setDescription("")
    setSelectedDate(new Date())
    setPaymentType("normal")
    setAdvancedForUserId("")
    setTransactionType("支出")

    // デフォルトユーザーを設定
    if (users.length > 0) {
      const activeUser = users.find((user) => user.isActive)
      const defaultUser = activeUser || users[0]
      setSelectedUser(defaultUser.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedUser) return

    // 立替の場合は立替対象が必須
    if (paymentType === "advanced" && !advancedForUserId) {
      alert("立替対象を選択してください。")
      return
    }

    const transactionData = {
      type: transactionType,
      amount: Number.parseFloat(amount),
      description,
      date: selectedDate,
      userId: selectedUser,
      isShared: paymentType === "shared",
      isAdvancedPayment: paymentType === "advanced",
      advancedForUserId: paymentType === "advanced" ? advancedForUserId : undefined,
    }

    if (selectedTransaction) {
      updateTransaction(selectedTransaction.id, transactionData)
      clearSelectedTransaction()
    } else {
      addTransaction(transactionData)
    }

    resetForm()
  }

  const handleCancel = () => {
    clearSelectedTransaction()
    resetForm()
  }

  // 自分以外のユーザーを取得
  const otherUsers = users.filter((user) => user.id !== selectedUser)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedTransaction ? "取引を編集" : "新規取引"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">ユーザー</Label>
            <Select onValueChange={setSelectedUser} value={selectedUser}>
              <SelectTrigger id="user">
                <SelectValue placeholder="ユーザーを選択" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                    {user.isActive && <span className="ml-2 text-xs text-green-600">(利用中)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">金額</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-8"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">円</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Input
              id="description"
              placeholder="説明を入力してください"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>日付</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                >
                  {selectedDate ? format(selectedDate, "PPP", { locale: ja }) : <span>日付を選択</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <RadioGroup value={transactionType} onValueChange={(value) => setTransactionType(value as "収入" | "支出")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="支出" id="支出" />
              <Label htmlFor="支出">支出</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="収入" id="収入" />
              <Label htmlFor="収入">収入</Label>
            </div>
          </RadioGroup>

          {transactionType === "支出" && (
            <div className="space-y-2">
              <Label>支出タイプ</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={paymentType === "normal" ? "default" : "outline"}
                  className="h-16 flex flex-col items-center justify-center"
                  onClick={() => {
                    setPaymentType("normal")
                    setAdvancedForUserId("")
                  }}
                >
                  <User className="h-4 w-4 mb-1" />
                  <span className="text-xs">個人</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentType === "shared" ? "default" : "outline"}
                  className="h-16 flex flex-col items-center justify-center"
                  onClick={() => {
                    setPaymentType("shared")
                    setAdvancedForUserId("")
                  }}
                >
                  <Users className="h-4 w-4 mb-1" />
                  <span className="text-xs">共同</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentType === "advanced" ? "default" : "outline"}
                  className="h-16 flex flex-col items-center justify-center"
                  onClick={() => {
                    setPaymentType("advanced")
                    if (otherUsers.length > 0) {
                      setAdvancedForUserId(otherUsers[0].id)
                    }
                  }}
                >
                  <CreditCard className="h-4 w-4 mb-1" />
                  <span className="text-xs">立替</span>
                </Button>
              </div>

              {paymentType === "advanced" && otherUsers.length > 0 && (
                <div className="mt-2">
                  <Label htmlFor="advancedForUser">
                    立替対象 <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={setAdvancedForUserId} value={advancedForUserId}>
                    <SelectTrigger id="advancedForUser" className={!advancedForUserId ? "border-red-300" : ""}>
                      <SelectValue placeholder="立替対象を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {paymentType === "advanced" && !advancedForUserId && (
                    <p className="text-sm text-red-500 mt-1">立替対象の選択は必須です</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            {selectedTransaction && (
              <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={handleCancel}>
                キャンセル
              </Button>
            )}
            <Button type="submit" className="flex-1">
              {selectedTransaction ? "取引を更新" : "取引を追加"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

const TransactionList = ({ transactions, deleteTransaction, users, selectTransaction }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedFilter, setSelectedFilter] = useState("all")

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.date.getMonth() === selectedMonth.getMonth() &&
          transaction.date.getFullYear() === selectedMonth.getFullYear() &&
          (selectedFilter === "all" ||
            (selectedFilter === "shared" && transaction.isShared) ||
            (selectedFilter === "advanced" && transaction.isAdvancedPayment) ||
            (!transaction.isShared && !transaction.isAdvancedPayment && transaction.userId === selectedFilter)),
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [transactions, selectedMonth, selectedFilter])

  const summary = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === "収入").reduce((sum, t) => sum + t.amount, 0)
    const expense = filteredTransactions.filter((t) => t.type === "支出").reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, difference: income - expense }
  }, [filteredTransactions])

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() + increment)
    setSelectedMonth(newDate)
  }

  const formatMonth = (date: Date) => {
    return format(date, "yyyy年 MM月", { locale: ja })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>取引一覧</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{formatMonth(selectedMonth)}</span>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="filter">フィルター</Label>
          <Select onValueChange={setSelectedFilter} value={selectedFilter}>
            <SelectTrigger id="filter">
              <SelectValue placeholder="フィルターを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              <SelectItem value="shared">共同</SelectItem>
              <SelectItem value="advanced">立替</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4 p-4 bg-gray-100 rounded-md">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold">収入</div>
              <div className="text-green-600">{summary.income.toLocaleString()}円</div>
            </div>
            <div>
              <div className="font-semibold">支出</div>
              <div className="text-red-600">{summary.expense.toLocaleString()}円</div>
            </div>
            <div>
              <div className="font-semibold">差額</div>
              <div className={summary.difference >= 0 ? "text-green-600" : "text-red-600"}>
                {summary.difference.toLocaleString()}円
              </div>
            </div>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500">該当する取引はありません。</p>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => selectTransaction(transaction)}
              >
                <div className="flex items-center">
                  {transaction.type === "収入" ? (
                    <Plus className="text-green-500 mr-2" />
                  ) : (
                    <Minus className="text-red-500 mr-2" />
                  )}
                  <div>
                    <div className="font-medium">{transaction.description || "(説明なし)"}</div>
                    <div className="text-sm text-gray-500">
                      {format(transaction.date, "yyyy/MM/dd")} - {users.find((u) => u.id === transaction.userId)?.name}
                      {transaction.isShared && " (共同)"}
                      {transaction.isAdvancedPayment &&
                        ` (${users.find((u) => u.id === transaction.advancedForUserId)?.name}の分を立替)`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`font-bold mr-2 ${transaction.type === "収入" ? "text-green-600" : "text-red-600"}`}>
                    {transaction.amount.toLocaleString()}円
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        selectTransaction(transaction)
                      }}
                      aria-label="取引を編集"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTransaction(transaction.id)
                      }}
                      aria-label="取引を削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

const ExpenseDifference = ({ transactions, users }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState("shared")

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() + increment)
    setSelectedMonth(newDate)
  }

  const formatMonth = (date: Date) => {
    return format(date, "yyyy年 MM月", { locale: ja })
  }

  const sharedExpensesDifference = useMemo(() => {
    const filteredTransactions = transactions.filter(
      (t) =>
        t.date.getMonth() === selectedMonth.getMonth() &&
        t.date.getFullYear() === selectedMonth.getFullYear() &&
        t.isShared &&
        t.type === "支出",
    )

    const sharedExpenses = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
    const averageExpense = sharedExpenses / users.length

    return users.map((user) => {
      const userSharedExpenses = filteredTransactions
        .filter((t) => t.userId === user.id)
        .reduce((sum, t) => sum + t.amount, 0)

      // 修正：共同支出の差額の符号を反転
      // 正の値：受け取る、負の値：支払う
      const difference = userSharedExpenses - averageExpense

      return {
        ...user,
        expense: userSharedExpenses,
        difference: difference,
      }
    })
  }, [transactions, users, selectedMonth])

  const advancedPaymentsDifference = useMemo(() => {
    const filteredTransactions = transactions.filter(
      (t) =>
        t.date.getMonth() === selectedMonth.getMonth() &&
        t.date.getFullYear() === selectedMonth.getFullYear() &&
        t.isAdvancedPayment &&
        t.type === "支出",
    )

    // ユーザーごとの立替金額を計算
    const advancedPayments = users.map((user) => {
      // このユーザーが他のユーザーのために立て替えた金額
      const paidForOthers = filteredTransactions
        .filter((t) => t.userId === user.id)
        .reduce((sum, t) => sum + t.amount, 0)

      // 他のユーザーがこのユーザーのために立て替えた金額
      const othersPayForUser = filteredTransactions
        .filter((t) => t.advancedForUserId === user.id)
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        ...user,
        paidForOthers,
        othersPayForUser,
        // 正の値は受け取る、負の値は支払う
        balance: paidForOthers - othersPayForUser,
      }
    })

    return advancedPayments
  }, [transactions, users, selectedMonth])

  const monthlySettlement = useMemo(() => {
    // 共同支出の差額を取得
    const sharedDifferences = sharedExpensesDifference.reduce((acc, user) => {
      acc[user.id] = user.difference
      return acc
    }, {})

    // 立替の差額を取得
    const advancedDifferences = advancedPaymentsDifference.reduce((acc, user) => {
      acc[user.id] = user.balance
      return acc
    }, {})

    // 合計を計算（プラスマイナスを考慮）
    return users.map((user) => {
      const sharedDiff = sharedDifferences[user.id] || 0 // 正の値：受け取る、負の値：支払う
      const advancedDiff = advancedDifferences[user.id] || 0 // 正の値：受け取る、負の値：支払う

      // 月次決算 = 共同支出の差額 + 立替の差額
      const totalDifference = sharedDiff + advancedDiff

      return {
        ...user,
        sharedDifference: sharedDiff,
        advancedDifference: advancedDiff,
        totalDifference,
      }
    })
  }, [sharedExpensesDifference, advancedPaymentsDifference, users])

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>精算</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{formatMonth(selectedMonth)}</span>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shared">
              <Users className="mr-2 h-4 w-4" />
              共同
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <CreditCard className="mr-2 h-4 w-4" />
              立替
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Calculator className="mr-2 h-4 w-4" />
              月次決算
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="h-[200px]">
          {activeTab === "shared" && (
            <>
              {sharedExpensesDifference.length === 0 ? (
                <p className="text-center text-gray-500">この月の共同支出はありません。</p>
              ) : (
                sharedExpensesDifference.map((user) => (
                  <div key={user.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span>{user.name}</span>
                    <div>
                      <span className="mr-2">共同支出: {user.expense.toLocaleString()}円</span>
                      <span className={user.difference > 0 ? "text-green-600" : "text-red-600"}>
                        差額: {Math.abs(user.difference).toLocaleString()}円
                        {user.difference > 0 ? " (受け取る)" : " (支払う必要あり)"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "advanced" && (
            <>
              {advancedPaymentsDifference.length === 0 ||
              advancedPaymentsDifference.every((u) => u.paidForOthers === 0 && u.othersPayForUser === 0) ? (
                <p className="text-center text-gray-500">この月の立替はありません。</p>
              ) : (
                advancedPaymentsDifference.map((user) => (
                  <div key={user.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span>{user.name}</span>
                    <div>
                      <div>
                        <span className="mr-2">立替支出: {user.paidForOthers.toLocaleString()}円</span>
                        <span className="mr-2">立替された: {user.othersPayForUser.toLocaleString()}円</span>
                      </div>
                      <span
                        className={
                          user.balance > 0 ? "text-green-600" : user.balance < 0 ? "text-red-600" : "text-gray-600"
                        }
                      >
                        差額: {Math.abs(user.balance).toLocaleString()}円
                        {user.balance > 0 ? " (受け取る)" : user.balance < 0 ? " (支払う必要あり)" : " (精算済み)"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "monthly" && (
            <>
              {monthlySettlement.every((u) => u.totalDifference === 0) ? (
                <p className="text-center text-gray-500">この月の精算はありません。</p>
              ) : (
                monthlySettlement.map((user) => (
                  <div key={user.id} className="py-3 border-b last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{user.name}</span>
                      <span
                        className={`font-bold ${
                          user.totalDifference > 0
                            ? "text-green-600"
                            : user.totalDifference < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        合計: {Math.abs(user.totalDifference).toLocaleString()}円
                        {user.totalDifference > 0
                          ? " (受け取る)"
                          : user.totalDifference < 0
                            ? " (支払う)"
                            : " (精算済み)"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        共同: {Math.abs(user.sharedDifference).toLocaleString()}円
                        {user.sharedDifference > 0
                          ? " (受け取る)"
                          : user.sharedDifference < 0
                            ? " (支払う)"
                            : " (精算済み)"}
                      </div>
                      <div>
                        立替: {Math.abs(user.advancedDifference).toLocaleString()}円
                        {user.advancedDifference > 0
                          ? " (受け取る)"
                          : user.advancedDifference < 0
                            ? " (支払う)"
                            : " (精算済み)"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default function Component() {
  const [users, setUsers] = useState<AppUser[]>([
    { id: "1", name: "太郎", isActive: true },
    { id: "2", name: "花子", isActive: false },
  ])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    setTransactions([{ ...transaction, id: Date.now() }, ...transactions])
  }

  const updateTransaction = (id: number, updatedData: Omit<Transaction, "id">) => {
    setTransactions(transactions.map((t) => (t.id === id ? { ...updatedData, id } : t)))
  }

  const deleteTransaction = (id: number) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  const selectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }

  const clearSelectedTransaction = () => {
    setSelectedTransaction(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Tabs defaultValue="transactions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">
            <Plus className="mr-2 h-4 w-4" />
            取引
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            ユーザー
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <User className="mr-2 h-4 w-4" />
            精算
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="space-y-4">
          <TransactionForm
            users={users}
            addTransaction={addTransaction}
            updateTransaction={updateTransaction}
            selectedTransaction={selectedTransaction}
            clearSelectedTransaction={clearSelectedTransaction}
          />
          <TransactionList
            transactions={transactions}
            deleteTransaction={deleteTransaction}
            users={users}
            selectTransaction={selectTransaction}
          />
        </TabsContent>
        <TabsContent value="users">
          <UserManagement users={users} setUsers={setUsers} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseDifference transactions={transactions} users={users} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
