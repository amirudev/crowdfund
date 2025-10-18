import { Card } from "~/components/card";
import type { Route } from "./+types/home";
import { TextRotate } from "~/components/text-rotate";
import { Donut } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useWallet } from "~/hooks/use-wallet";
import { useNativeBalance } from "~/hooks/use-native-balance";
import { useSubmitTransaction } from "~/hooks/use-submit-transaction";
import { Client as CrowdfundClient, networks as crowdfundNetworks } from "../../packages/CC3SECF2DEOVUCMG6DATOCTKYOIVJ3DOCJZDT2OG6T6UMOJS3Q3O7SCF";
import { signTransaction } from "~/config/wallet.client";
import { useState, useMemo, useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const RPC_URL = "https://soroban-testnet.stellar.org:443";
  const { address, isConnected } = useWallet();
  const { balance, refetch: refetchBalance } = useNativeBalance(address);

  const [amount, setAmount] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  
  // Campaign data
  const [goal, setGoal] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [isGoalReached, setIsGoalReached] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isRefunding, setIsRefunding] = useState(false);

  const contract = useMemo(() => {
    if (!isConnected || address === "-") return null;

    return new CrowdfundClient({
      ...crowdfundNetworks.testnet,
      rpcUrl: RPC_URL,
      signTransaction,
      publicKey: address,
    });
  }, [isConnected, address]);

  const { submit, isSubmitting } = useSubmitTransaction({
    rpcUrl: RPC_URL,
    networkPassphrase: crowdfundNetworks.testnet.networkPassphrase,
    onSuccess: handleOnSuccess,
    onError: (error) => {
      console.error("Donation failed", error);
    },
  });

  async function handleOnSuccess() {
    // Fetch updated total
    if (contract) {
      setPreviousTotal(total);
      const totalTx = await contract.get_total_raised() as any;
      const updated = BigInt(totalTx.result);
      setTotal(Number(updated));
    }
    await refetchBalance();
    setAmount("");
  }


  async function fetchCampaignData() {
    if (!contract) return;

    try {
      // Fetch all campaign data in parallel
      const [goalTx, deadlineTx, goalReachedTx, endedTx, progressTx] = await Promise.all([
        contract.get_goal() as any,
        contract.get_deadline() as any,
        contract.is_goal_reached() as any,
        contract.is_ended() as any,
        contract.get_progress_percentage() as any,
      ]);

      setGoal(Number(BigInt(goalTx.result)));
      setDeadline(Number(BigInt(deadlineTx.result)));
      setIsGoalReached(goalReachedTx.result);
      setIsEnded(endedTx.result);
      setProgressPercentage(Number(BigInt(progressTx.result)));
    } catch (err) {
      console.error("Error fetching campaign data:", err);
    }
  }

  async function handleRefund() {
    if (!isConnected || !contract || !address) return;

    setIsRefunding(true);
    try {
      const tx = await contract.refund({
        donor: address,
      }) as any;

      await submit(tx);
      
      // Refresh data after successful refund
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      console.error("Failed to refund", e);
    } finally {
      setIsRefunding(false);
    }
  }

  async function handleSubmit() {
    if (!isConnected || !contract) return;
    if (!amount.trim()) return;
    if (!isInitialized) {
      console.error("Contract not initialized - cannot donate");
      return;
    }

    try {
      // Convert XLM to stroops (multiply by 10^7)
      const xlmAmount = parseFloat(amount.trim());
      const stroopsAmount = Math.floor(xlmAmount * 10_000_000);

      const tx = await contract.donate({
        donor: address,
        amount: BigInt(stroopsAmount),
      }) as any;

      await submit(tx);
    } catch (e) {
      console.error("Failed to create donation transaction", e);
    }
  }

  useEffect(() => {
    if (!contract) return;

    (async () => {
      try {
        // First check if contract is initialized
        const initTx = await contract.get_is_already_init() as any;
        const isInitialized = initTx.result;
        
        console.log("Contract initialized:", isInitialized);
        setIsInitialized(isInitialized);
        
        if (isInitialized) {
          // Get total raised if initialized
          const tx = await contract.get_total_raised() as any;
          const total = Number(BigInt(tx.result));
          setTotal(total);
          
          // Fetch all campaign data
          await fetchCampaignData();
        } else {
          console.log("Contract not initialized - donations will fail");
          setTotal(0);
        }
      } catch (err) {
        console.error("Error checking contract status:", err);
        setTotal(0);
        setIsInitialized(false);
      }
    })();
  }, [contract]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex flex-row items-center justify-center gap-x-6 mb-4">
            <p className="text-5xl font-bold text-white">Learning</p>
            <TextRotate
              texts={["Stellar", "Rust", "Contract", "Frontend"]}
              mainClassName="bg-gray-800 text-white rounded-lg text-5xl px-6 py-3 shadow-lg border border-gray-700"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </div>
          <p className="text-xl text-gray-300">Decentralized Crowdfunding Platform</p>
        </div>

        {/* Campaign Status Cards */}
        {isInitialized && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Goal Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Campaign Goal</p>
                  <p className="text-2xl font-bold">{(goal / 10_000_000).toFixed(2)} XLM</p>
                </div>
                <div className="text-3xl">🎯</div>
              </div>
            </Card>

            {/* Raised Card */}
            <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Raised</p>
                  <p className="text-2xl font-bold">{(total / 10_000_000).toFixed(2)} XLM</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </Card>

            {/* Progress Card */}
            <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Progress</p>
                  <p className="text-2xl font-bold">{progressPercentage}%</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </Card>

            {/* Status Card */}
            <Card className={`p-6 text-white ${isGoalReached ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : isEnded ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Status</p>
                  <p className="text-lg font-bold">
                    {isGoalReached ? 'Goal Reached!' : isEnded ? 'Campaign Ended' : 'Active'}
                  </p>
                </div>
                <div className="text-3xl">
                  {isGoalReached ? '🎉' : isEnded ? '⏰' : '🚀'}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Section */}
          <Card className="p-8 bg-gray-800 shadow-xl border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Donut className="size-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Make a Donation</h2>
            </div>

            {/* Wallet Balance */}
            <div className="flex justify-between items-center mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex items-center gap-3">
                <img src="https://placehold.co/10" className="size-8 rounded-full" />
                <span className="font-medium text-gray-200">Your XLM Balance</span>
              </div>
              <div className="text-right">
                {!isConnected && <span className="text-gray-400">Connect wallet</span>}
                {isConnected && balance === "-" && <span className="text-gray-400">-</span>}
                {isConnected && balance !== "-" && (
                  <span className="font-bold text-lg text-white">{balance} XLM</span>
                )}
              </div>
            </div>

            {/* Donation Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Donation Amount (XLM)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.001"
                onChange={(e) => setAmount(e.target.value)}
                value={amount}
                disabled={isSubmitting || isEnded}
                className="text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isInitialized === false ? (
                <div className="text-center p-6 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <p className="text-yellow-300 font-medium mb-2">Contract Not Initialized</p>
                  <p className="text-sm text-yellow-400">
                    Please initialize the contract from the contract folder using Soroban CLI first.
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSubmit}
                    disabled={!isConnected || isSubmitting || !amount.trim() || isEnded}
                  >
                    {isSubmitting ? "Processing..." : "Donate Now"}
                  </Button>
                  
                  {/* Refund Button */}
                  {isEnded && !isGoalReached && (
                    <Button
                      className="w-full py-3 text-lg bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleRefund}
                      disabled={!isConnected || isRefunding}
                    >
                      {isRefunding ? "Processing Refund..." : "Request Refund"}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Status Messages */}
            <div className="mt-6 space-y-2">
              {isInitialized === false && (
                <p className="text-sm text-red-300 bg-red-900/20 border border-red-700 p-3 rounded-lg">
                  ⚠️ Contract not initialized - Please initialize from contract folder first
                </p>
              )}
              {isInitialized === true && !isEnded && (
                <p className="text-sm text-green-300 bg-green-900/20 border border-green-700 p-3 rounded-lg">
                  ✅ Campaign active - Ready for donations
                </p>
              )}
              {isEnded && isGoalReached && (
                <p className="text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700 p-3 rounded-lg">
                  🎉 Campaign ended successfully - Goal reached!
                </p>
              )}
              {isEnded && !isGoalReached && (
                <p className="text-sm text-orange-300 bg-orange-900/20 border border-orange-700 p-3 rounded-lg">
                  ⏰ Campaign ended - Goal not reached. You can request a refund.
                </p>
              )}
            </div>
          </Card>

          {/* Campaign Details Section */}
          <div className="space-y-6">
            {/* Progress Bar */}
            {isInitialized && (
              <Card className="p-6 bg-gray-800 shadow-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Campaign Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>{(total / 10_000_000).toFixed(2)} XLM raised</span>
                    <span>{(goal / 10_000_000).toFixed(2)} XLM goal</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${
                        isGoalReached ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">{progressPercentage}%</span>
                    <span className="text-sm text-gray-300 ml-2">Complete</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Campaign Info */}
            {isInitialized && (
              <Card className="p-6 bg-gray-800 shadow-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Campaign Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-600">
                    <span className="text-gray-300">Goal</span>
                    <span className="font-semibold text-white">{(goal / 10_000_000).toFixed(2)} XLM</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-600">
                    <span className="text-gray-300">Deadline</span>
                    <span className="font-semibold text-white">
                      {new Date(deadline * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-600">
                    <span className="text-gray-300">Days Remaining</span>
                    <span className="font-semibold text-white">
                      {Math.max(0, Math.ceil((deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-300">Status</span>
                    <span className={`font-semibold ${
                      isGoalReached ? 'text-green-400' : isEnded ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {isGoalReached ? 'Goal Reached' : isEnded ? 'Ended' : 'Active'}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            {isInitialized && previousTotal > 0 && previousTotal !== total && (
              <Card className="p-6 bg-gray-800 shadow-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <p className="font-semibold text-green-300">New Donation!</p>
                    <p className="text-sm text-green-400">
                      +{((total - previousTotal) / 10_000_000).toFixed(7)} XLM added
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}